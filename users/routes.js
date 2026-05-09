/**
 * Copyright 2021 fernando.reyes@du.edu
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const USERS = require('../users/controller');
const TOKEN = require('../libs/tokens');
const FIELDS = require('../libs/validate');
const LOGGER = require('../libs/log4');

/**
 * Request logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function log_request(req, res, next) {
    const start_time = Date.now();

    res.on('finish', function () {
        const duration = Date.now() - start_time;
        const log_data = {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration_ms: duration
        };

        if (res.statusCode >= 400) {
            LOGGER.module().warn('Request completed with error: ' + JSON.stringify(log_data));
        } else {
            LOGGER.module().info('Request completed: ' + JSON.stringify(log_data));
        }
    });

    next();
}

/**
 * Validates Content-Type header for JSON endpoints
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validate_content_type(req, res, next) {
    const methods_requiring_body = ['POST', 'PUT', 'PATCH'];

    if (methods_requiring_body.includes(req.method)) {
        const content_type = req.get('Content-Type');

        if (!content_type || !content_type.includes('application/json')) {
            return res.status(415).send({
                message: 'Content-Type must be application/json'
            });
        }
    }

    next();
}

/**
 * Rate limiting state (in production, use Redis or similar)
 * @type {Map<string, {count: number, reset_time: number}>}
 */
const rate_limit_store = new Map();

/**
 * Configuration for rate limiting
 * @type {Readonly<Object>}
 */
const RATE_LIMIT_CONFIG = Object.freeze({
    WINDOW_MS: 60 * 1000,
    MAX_REQUESTS: 100,
    AUTH_MAX_REQUESTS: 100
});

/**
 * Creates rate limiting middleware
 * @param {number} max_requests - Maximum requests per window
 * @returns {Function} - Express middleware function
 */
function create_rate_limiter(max_requests) {
    return function (req, res, next) {
        const client_ip = req.ip || req.connection.remoteAddress || 'unknown';
        const key = client_ip + ':' + req.path;
        const now = Date.now();

        let client_data = rate_limit_store.get(key);

        if (!client_data || now > client_data.reset_time) {
            client_data = {
                count: 0,
                reset_time: now + RATE_LIMIT_CONFIG.WINDOW_MS
            };
        }

        client_data.count += 1;
        rate_limit_store.set(key, client_data);

        const remaining = Math.max(0, max_requests - client_data.count);
        const reset_seconds = Math.ceil((client_data.reset_time - now) / 1000);

        res.set('X-RateLimit-Limit', String(max_requests));
        res.set('X-RateLimit-Remaining', String(remaining));
        res.set('X-RateLimit-Reset', String(reset_seconds));

        if (client_data.count > max_requests) {
            LOGGER.module().warn('Rate limit exceeded for: ' + client_ip);

            return res.status(429).send({
                message: 'Too many requests, please try again later',
                retry_after_seconds: reset_seconds
            });
        }

        next();
    };
}

/**
 * Cleans expired rate limit entries periodically
 */
function cleanup_rate_limit_store() {
    const now = Date.now();

    for (const [key, data] of rate_limit_store.entries()) {
        if (now > data.reset_time) {
            rate_limit_store.delete(key);
        }
    }
}

// Run cleanup every minute
setInterval(cleanup_rate_limit_store, 60 * 1000);

/**
 * Standard rate limiter for most endpoints
 * @type {Function}
 */
const standard_rate_limiter = create_rate_limiter(RATE_LIMIT_CONFIG.MAX_REQUESTS);

/**
 * Stricter rate limiter for authentication endpoints
 * @type {Function}
 */
const auth_rate_limiter = create_rate_limiter(RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS);

/**
 * Registers user routes with Express application
 * @param {Object} app - Express application instance
 */
module.exports = function (app) {

    // Apply request logging to all user routes
    app.use('/api/users', log_request);
    app.use('/api/auth', log_request);

    // Apply content-type validation to all user routes
    app.use('/api/users', validate_content_type);
    app.use('/api/auth', validate_content_type);

    /**
     * User management routes
     * Base path: /api/users
     */
    app.route('/api/users')
        /**
         * POST /api/users
         * Creates new user account
         * Body: { username, password, first_name?, last_name? }
         */
        .post(
            standard_rate_limiter,
            FIELDS.validate_user,
            USERS.save
        )
        /**
         * GET /api/users
         * Retrieves authenticated user data
         * Query: api_key
         * Headers: Authorization (Bearer token)
         */
        .get(
            standard_rate_limiter,
            TOKEN.verify,
            USERS.read
        )
        /**
         * PUT /api/users
         * Updates user profile data
         * Query: api_key
         * Headers: Authorization (Bearer token)
         * Body: { id, first_name?, last_name? }
         */
        .put(
            standard_rate_limiter,
            TOKEN.verify,
            FIELDS.validate_user,
            USERS.update
        )
        /**
         * DELETE /api/users
         * Deletes user account (requires password confirmation)
         * Query: api_key
         * Headers: Authorization (Bearer token)
         * Body: { password }
         */
        .delete(
            standard_rate_limiter,
            TOKEN.verify,
            USERS.delete_account
        );

    /**
     * Password management route
     * PUT /api/users/password
     * Updates user password
     * Query: api_key
     * Headers: Authorization (Bearer token)
     * Body: { current_password, new_password }
     */
    app.route('/api/users/password')
        .put(
            standard_rate_limiter,
            TOKEN.verify,
            USERS.update_password
        );

    /**
     * API key management route
     * POST /api/users/api-key
     * Regenerates user API key
     * Query: api_key
     * Headers: Authorization (Bearer token)
     */
    app.route('/api/users/api-key')
        .post(
            standard_rate_limiter,
            TOKEN.verify,
            USERS.regenerate_api_key
        );

    /**
     * Authentication route
     * POST /api/auth
     * Authenticates user and returns token
     * Body: { username, password }
     */
    app.route('/api/auth')
        .post(
            auth_rate_limiter,
            USERS.authenticate
        );
};