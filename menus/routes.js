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

const MENUS = require('../menus/controller');
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
    MAX_REQUESTS: 1000
});

/**
 * Creates rate limiting middleware
 * @param {number} max_requests - Maximum requests per window
 * @returns {Function} - Express middleware function
 */
function create_rate_limiter(max_requests) {
    return function (req, res, next) {
        const client_ip = req.ip || req.connection.remoteAddress || 'unknown';
        const key = client_ip + ':' + req.baseUrl;
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
 * Standard rate limiter for menu endpoints
 * @type {Function}
 */
const standard_rate_limiter = create_rate_limiter(RATE_LIMIT_CONFIG.MAX_REQUESTS);

/**
 * Registers menu routes with Express application
 * @param {Object} app - Express application instance
 */
module.exports = function (app) {

    // Apply request logging to all menu routes
    app.use('/api/menus', log_request);

    // Apply content-type validation to all menu routes
    app.use('/api/menus', validate_content_type);

    /**
     * Menu item management routes
     * Base path: /api/menus
     *
     * Database schema fields: id, item, description, price, api_key
     */
    app.route('/api/menus')
        /**
         * POST /api/menus
         * Creates new menu item
         * Query: api_key
         * Headers: Authorization (Bearer token)
         * Body: { item, description, price }
         */
        .post(
            standard_rate_limiter,
            TOKEN.verify,
            FIELDS.validate_menu_item,
            MENUS.save
        )
        /**
         * GET /api/menus
         * Retrieves all menu items for authenticated user
         * Optionally filter by single item ID
         * Query: api_key, id? (optional)
         * Headers: Authorization (Bearer token)
         */
        .get(
            standard_rate_limiter,
            TOKEN.verify,
            MENUS.read
        )
        /**
         * PUT /api/menus
         * Updates existing menu item
         * Query: api_key
         * Headers: Authorization (Bearer token)
         * Body: { id, item?, description?, price? }
         */
        .put(
            standard_rate_limiter,
            TOKEN.verify,
            FIELDS.validate_menu_item_update,
            MENUS.update
        )
        /**
         * DELETE /api/menus
         * Deletes menu item by ID
         * Query: api_key, id
         * Headers: Authorization (Bearer token)
         */
        .delete(
            standard_rate_limiter,
            TOKEN.verify,
            MENUS.delete_item
        );

    /**
     * Bulk operations route
     * POST /api/menus/bulk
     * Retrieves multiple menu items by IDs
     * Query: api_key
     * Headers: Authorization (Bearer token)
     * Body: { ids: [1, 2, 3, ...] }
     */
    app.route('/api/menus/bulk')
        .post(
            standard_rate_limiter,
            TOKEN.verify,
            MENUS.read_bulk
        );

    /**
     * Search route
     * GET /api/menus/search
     * Searches menu items by name or description
     * Query: api_key, q (search term)
     * Headers: Authorization (Bearer token)
     */
    app.route('/api/menus/search')
        .get(
            standard_rate_limiter,
            TOKEN.verify,
            MENUS.search
        );
};