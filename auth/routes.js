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

const AUTH = require('../auth/controller');
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
            LOGGER.module().warn('Auth request completed with error: ' + JSON.stringify(log_data));
        } else {
            LOGGER.module().info('Auth request completed: ' + JSON.stringify(log_data));
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
    const content_type = req.get('Content-Type');

    if (!content_type || !content_type.includes('application/json')) {
        return res.status(415).send({
            message: 'Content-Type must be application/json'
        });
    }

    next();
}

/**
 * Rate limiting state for authentication endpoints
 * In production, use Redis or similar for distributed rate limiting
 * @type {Map<string, {count: number, reset_time: number, blocked_until: number}>}
 */
const rate_limit_store = new Map();

/**
 * Configuration for authentication rate limiting
 * Stricter limits to prevent brute force attacks
 * @type {Readonly<Object>}
 */
const RATE_LIMIT_CONFIG = Object.freeze({
    WINDOW_MS: 60 * 1000,
    MAX_REQUESTS: 100,
    BLOCK_DURATION_MS: 5 * 60 * 1000,
    MAX_FAILED_ATTEMPTS: 100
});

/**
 * Authentication rate limiting middleware
 * Implements progressive blocking for repeated failures
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function auth_rate_limiter(req, res, next) {
    const client_ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    let client_data = rate_limit_store.get(client_ip);

    // Check if client is blocked
    if (client_data && client_data.blocked_until && now < client_data.blocked_until) {
        const retry_after = Math.ceil((client_data.blocked_until - now) / 1000);

        LOGGER.module().warn('Blocked auth attempt from: ' + client_ip);

        res.set('Retry-After', String(retry_after));

        return res.status(429).send({
            message: 'Too many failed attempts. Please try again later.',
            retry_after_seconds: retry_after
        });
    }

    // Reset or initialize client data if window expired
    if (!client_data || now > client_data.reset_time) {
        client_data = {
            count: 0,
            failed_count: client_data ? client_data.failed_count : 0,
            reset_time: now + RATE_LIMIT_CONFIG.WINDOW_MS,
            blocked_until: null
        };
    }

    client_data.count += 1;
    rate_limit_store.set(client_ip, client_data);

    const remaining = Math.max(0, RATE_LIMIT_CONFIG.MAX_REQUESTS - client_data.count);
    const reset_seconds = Math.ceil((client_data.reset_time - now) / 1000);

    res.set('X-RateLimit-Limit', String(RATE_LIMIT_CONFIG.MAX_REQUESTS));
    res.set('X-RateLimit-Remaining', String(remaining));
    res.set('X-RateLimit-Reset', String(reset_seconds));

    if (client_data.count > RATE_LIMIT_CONFIG.MAX_REQUESTS) {
        LOGGER.module().warn('Auth rate limit exceeded for: ' + client_ip);

        return res.status(429).send({
            message: 'Too many requests. Please try again later.',
            retry_after_seconds: reset_seconds
        });
    }

    // Track failed attempts after response
    res.on('finish', function () {
        if (res.statusCode === 401) {
            const data = rate_limit_store.get(client_ip);

            if (data) {
                data.failed_count = (data.failed_count || 0) + 1;

                // Block client if too many failed attempts
                if (data.failed_count >= RATE_LIMIT_CONFIG.MAX_FAILED_ATTEMPTS) {
                    data.blocked_until = Date.now() + RATE_LIMIT_CONFIG.BLOCK_DURATION_MS;
                    data.failed_count = 0;

                    LOGGER.module().warn('Client blocked due to failed attempts: ' + client_ip);
                }

                rate_limit_store.set(client_ip, data);
            }
        } else if (res.statusCode === 200) {
            // Reset failed count on successful login
            const data = rate_limit_store.get(client_ip);

            if (data) {
                data.failed_count = 0;
                rate_limit_store.set(client_ip, data);
            }
        }
    });

    next();
}

/**
 * Cleans expired rate limit entries periodically
 */
function cleanup_rate_limit_store() {
    const now = Date.now();

    for (const [key, data] of rate_limit_store.entries()) {
        // Remove entries that are past their window and not blocked
        if (now > data.reset_time && (!data.blocked_until || now > data.blocked_until)) {
            rate_limit_store.delete(key);
        }
    }
}

// Run cleanup every minute
setInterval(cleanup_rate_limit_store, 60 * 1000);

/**
 * Registers authentication routes with Express application
 * @param {Object} app - Express application instance
 */
module.exports = function (app) {

    // Apply middleware to login route
    app.use('/api/login', log_request);
    app.use('/api/login', validate_content_type);

    /**
     * Authentication route
     * POST /api/login
     * Authenticates user and returns token with user data
     * Body: { username, password }
     * Returns: { user: { id, username, first_name, last_name, api_key, token } }
     */
    app.route('/api/login')
        .post(
            auth_rate_limiter,
            FIELDS.validate_auth,
            AUTH.authenticate
        );
};