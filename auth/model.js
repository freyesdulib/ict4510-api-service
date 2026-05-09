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

const DB = require('../config/db')();
const BCRYPT = require('../libs/bcrypt');
const TOKENS = require('../libs/tokens');
const LOGGER = require('../libs/log4');

/**
 * Configuration constants
 * @type {Readonly<Object>}
 */
const CONFIG = Object.freeze({
    DB_TIMEOUT_MS: 5000,
    USERNAME_MAX_LENGTH: 50,
    PASSWORD_MAX_LENGTH: 128,
    // Dummy hash for timing attack prevention (valid bcrypt format)
    DUMMY_HASH: '$2b$10$abcdefghijklmnopqrstuuaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
});

/**
 * Wraps database operation with timeout protection
 * @param {Promise} db_promise - Database promise
 * @param {number} [timeout_ms] - Timeout in milliseconds
 * @returns {Promise}
 */
function with_timeout(db_promise, timeout_ms = CONFIG.DB_TIMEOUT_MS) {
    let timeout_id;

    const timeout_promise = new Promise((_, reject) => {
        timeout_id = setTimeout(() => {
            reject(new Error('Database operation timed out'));
        }, timeout_ms);
    });

    return Promise.race([db_promise, timeout_promise]).finally(() => {
        clearTimeout(timeout_id);
    });
}

/**
 * Creates standardized error response
 * @param {Error} error - Error object
 * @param {string} default_message - Default error message
 * @returns {Object} - Response object with status and data
 */
function handle_error(error, default_message) {
    LOGGER.module().error('ERROR: ' + default_message + ': ' + error.message);

    if (error.message === 'Database operation timed out') {
        return {
            status: 504,
            data: {
                message: 'Database operation timed out'
            }
        };
    }

    return {
        status: 500,
        data: {
            message: default_message
        }
    };
}

/**
 * Validates and sanitizes authentication credentials
 * @param {Object} body - Request body
 * @returns {Object} - Validation result with sanitized data or error
 */
function validate_credentials(body) {
    if (!body || typeof body !== 'object') {
        return {
            valid: false,
            error: 'Bad request: missing request body'
        };
    }

    const { username, password } = body;

    if (!username || typeof username !== 'string') {
        return {
            valid: false,
            error: 'Username is required'
        };
    }

    if (!password || typeof password !== 'string') {
        return {
            valid: false,
            error: 'Password is required'
        };
    }

    const trimmed_username = username.trim();

    if (trimmed_username.length === 0) {
        return {
            valid: false,
            error: 'Username cannot be empty'
        };
    }

    if (trimmed_username.length > CONFIG.USERNAME_MAX_LENGTH) {
        return {
            valid: false,
            error: 'Username exceeds maximum length'
        };
    }

    if (password.length > CONFIG.PASSWORD_MAX_LENGTH) {
        return {
            valid: false,
            error: 'Password exceeds maximum length'
        };
    }

    return {
        valid: true,
        username: trimmed_username.toLowerCase(),
        password: password
    };
}

/**
 * Authenticates user with username and password
 * @param {Object} req - Request object
 * @returns {Promise<Object>} - Response object with status and data
 */
exports.authenticate = async function (req) {
    try {
        const validation = validate_credentials(req.body);

        if (!validation.valid) {
            return {
                status: 400,
                data: {
                    message: validation.error
                }
            };
        }

        const { username, password } = validation;

        const user = await with_timeout(
            DB('users')
                .where({ username: username })
                .select('id', 'username', 'password', 'first_name', 'last_name', 'api_key')
                .first()
        );

        // Prevent timing attacks by always performing hash comparison
        if (!user) {
            BCRYPT.verify(password, CONFIG.DUMMY_HASH);

            return {
                status: 401,
                data: {
                    message: 'Invalid credentials'
                }
            };
        }

        const is_authenticated = BCRYPT.verify(password, user.password);

        if (!is_authenticated) {
            return {
                status: 401,
                data: {
                    message: 'Invalid credentials'
                }
            };
        }

        const user_response = {
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            api_key: user.api_key,
            token: TOKENS.create(user.username)
        };

        LOGGER.module().info('User authenticated successfully: ' + username);

        return {
            status: 200,
            data: {
                user: user_response
            }
        };

    } catch (error) {
        return handle_error(error, 'Authentication service unavailable');
    }
};