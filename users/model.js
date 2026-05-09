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
const KEYGEN = require('hat');
const LOGGER = require('../libs/log4');

/**
 * Configuration constants
 * @type {Readonly<Object>}
 */
const CONFIG = Object.freeze({
    DB_TIMEOUT_MS: 5000,
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 50,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    NAME_MAX_LENGTH: 100,
    ALLOWED_USER_FIELDS: ['first_name', 'last_name'],
    USERNAME_PATTERN: /^[a-z0-9_.-]+$/,
    // Dummy hash for timing attack prevention (valid bcrypt format)
    DUMMY_HASH: '$2b$10$abcdefghijklmnopqrstuuaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
});

/**
 * Validation utilities
 * @namespace validators
 */
const validators = {
    /**
     * Validates string is non-empty and within length bounds
     * @param {*} value - Value to validate
     * @param {number} [min_length=1] - Minimum length
     * @param {number} [max_length=255] - Maximum length
     * @returns {boolean}
     */
    is_valid_string(value, min_length = 1, max_length = 255) {
        return typeof value === 'string' &&
            value.trim().length >= min_length &&
            value.trim().length <= max_length;
    },

    /**
     * Validates username format
     * @param {string} username - Username to validate
     * @returns {boolean}
     */
    is_valid_username(username) {
        if (!this.is_valid_string(username, CONFIG.USERNAME_MIN_LENGTH, CONFIG.USERNAME_MAX_LENGTH)) {
            return false;
        }
        return CONFIG.USERNAME_PATTERN.test(username.toLowerCase());
    },

    /**
     * Validates password meets requirements
     * @param {string} password - Password to validate
     * @returns {boolean}
     */
    is_valid_password(password) {
        return this.is_valid_string(password, CONFIG.PASSWORD_MIN_LENGTH, CONFIG.PASSWORD_MAX_LENGTH);
    },

    /**
     * Validates positive integer
     * @param {*} value - Value to validate
     * @returns {boolean}
     */
    is_valid_id(value) {
        if (value === null || value === undefined) {
            return false;
        }
        const parsed = parseInt(value, 10);
        return !isNaN(parsed) && parsed > 0 && String(parsed) === String(value);
    },

    /**
     * Validates API key format (hat generates 128-bit hex strings)
     * @param {string} api_key - API key to validate
     * @returns {boolean}
     */
    is_valid_api_key(api_key) {
        if (typeof api_key !== 'string') {
            return false;
        }
        return /^[a-f0-9]{32}$/i.test(api_key);
    }
};

/**
 * Extracts and validates API key from request query
 * @param {Object} query - Request query object
 * @returns {string|null} - Validated API key or null
 */
function extract_api_key(query) {
    if (!query || typeof query !== 'object') {
        return null;
    }

    let api_key = query.api_key;

    if (Array.isArray(api_key)) {
        api_key = api_key[api_key.length - 1];
    }

    if (!validators.is_valid_api_key(api_key)) {
        return null;
    }

    return api_key;
}

/**
 * Sanitizes user object for safe update operations
 * @param {Object} user_data - Raw user data
 * @returns {Object} - Sanitized user data with only allowed fields
 */
function sanitize_user_update(user_data) {
    const sanitized = {};

    for (const field of CONFIG.ALLOWED_USER_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(user_data, field) && user_data[field] !== undefined) {
            const value = user_data[field];

            if (typeof value === 'string') {
                sanitized[field] = value.trim().substring(0, CONFIG.NAME_MAX_LENGTH);
            }
        }
    }

    return sanitized;
}

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
 * Saves user data to database
 * @param {Object} req - Request object
 * @returns {Promise<Object>} - Response object with status and data
 */
exports.save = async function (req) {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return {
                status: 400,
                data: {
                    message: 'Bad request: missing request body'
                }
            };
        }

        const { username, password, first_name, last_name } = req.body;

        if (!validators.is_valid_username(username)) {
            return {
                status: 400,
                data: {
                    message: 'Invalid username: must be 3-50 alphanumeric characters, underscores, dots, or hyphens'
                }
            };
        }

        if (!validators.is_valid_password(password)) {
            return {
                status: 400,
                data: {
                    message: 'Invalid password: must be 8-128 characters'
                }
            };
        }

        const normalized_username = username.toLowerCase().trim();

        const existing_user = await with_timeout(
            DB('users')
                .where({ username: normalized_username })
                .select('id')
                .first()
        );

        if (existing_user) {
            return {
                status: 409,
                data: {
                    message: 'Username already exists'
                }
            };
        }

        const user_record = {
            username: normalized_username,
            password: BCRYPT.encrypt(password),
            api_key: KEYGEN(),
            first_name: first_name ? first_name.trim().substring(0, CONFIG.NAME_MAX_LENGTH) : '',
            last_name: last_name ? last_name.trim().substring(0, CONFIG.NAME_MAX_LENGTH) : ''
        };

        const [inserted_id] = await with_timeout(
            DB('users').insert(user_record)
        );

        LOGGER.module().info('User created successfully: ' + normalized_username);

        return {
            status: 201,
            data: {
                message: 'User created successfully',
                id: inserted_id
            }
        };

    } catch (error) {
        return handle_error(error, 'Unable to create user');
    }
};

/**
 * Gets user by API key
 * @param {Object} req - Request object
 * @returns {Promise<Object>} - Response object with status and data
 */
exports.read = async function (req) {
    try {
        const api_key = extract_api_key(req.query);

        if (!api_key) {
            return {
                status: 400,
                data: {
                    message: 'Invalid or missing API key'
                }
            };
        }

        const user = await with_timeout(
            DB('users')
                .where({ api_key: api_key })
                .select('id', 'username', 'first_name', 'last_name')
                .first()
        );

        if (!user) {
            return {
                status: 404,
                data: {
                    message: 'User not found'
                }
            };
        }

        return {
            status: 200,
            data: {
                user: user
            }
        };

    } catch (error) {
        return handle_error(error, 'Unable to retrieve user');
    }
};

/**
 * Updates user data by ID and API key
 * @param {Object} req - Request object
 * @returns {Promise<Object>} - Response object with status and data
 */
exports.update = async function (req) {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return {
                status: 400,
                data: {
                    message: 'Bad request: missing request body'
                }
            };
        }

        const api_key = extract_api_key(req.query);

        if (!api_key) {
            return {
                status: 400,
                data: {
                    message: 'Invalid or missing API key'
                }
            };
        }

        const user_id = req.body.id;

        if (!validators.is_valid_id(user_id)) {
            return {
                status: 400,
                data: {
                    message: 'Invalid user ID'
                }
            };
        }

        const update_data = sanitize_user_update(req.body);

        if (Object.keys(update_data).length === 0) {
            return {
                status: 400,
                data: {
                    message: 'No valid fields to update'
                }
            };
        }

        const rows_updated = await with_timeout(
            DB('users')
                .where({
                    api_key: api_key,
                    id: user_id
                })
                .update(update_data)
        );

        if (rows_updated === 0) {
            return {
                status: 404,
                data: {
                    message: 'User not found or unauthorized'
                }
            };
        }

        LOGGER.module().info('User updated successfully: ID ' + user_id);

        return {
            status: 204,
            data: null
        };

    } catch (error) {
        return handle_error(error, 'Unable to update user');
    }
};

/**
 * Authenticates user with username and password
 * @param {Object} req - Request object
 * @returns {Promise<Object>} - Response object with status and data
 */
exports.authenticate = async function (req) {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return {
                status: 400,
                data: {
                    message: 'Bad request: missing request body'
                }
            };
        }

        const { username, password } = req.body;

        if (!username || !password ||
            typeof username !== 'string' ||
            typeof password !== 'string') {
            return {
                status: 400,
                data: {
                    message: 'Username and password are required'
                }
            };
        }

        const normalized_username = username.toLowerCase().trim();

        const user = await with_timeout(
            DB('users')
                .where({ username: normalized_username })
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

        LOGGER.module().info('User authenticated successfully: ' + normalized_username);

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

/**
 * Updates user password
 * @param {Object} req - Request object
 * @returns {Promise<Object>} - Response object with status and data
 */
exports.update_password = async function (req) {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return {
                status: 400,
                data: {
                    message: 'Bad request: missing request body'
                }
            };
        }

        const api_key = extract_api_key(req.query);

        if (!api_key) {
            return {
                status: 400,
                data: {
                    message: 'Invalid or missing API key'
                }
            };
        }

        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return {
                status: 400,
                data: {
                    message: 'Current password and new password are required'
                }
            };
        }

        if (!validators.is_valid_password(new_password)) {
            return {
                status: 400,
                data: {
                    message: 'New password must be 8-128 characters'
                }
            };
        }

        const user = await with_timeout(
            DB('users')
                .where({ api_key: api_key })
                .select('id', 'password')
                .first()
        );

        if (!user) {
            return {
                status: 404,
                data: {
                    message: 'User not found'
                }
            };
        }

        const is_current_valid = BCRYPT.verify(current_password, user.password);

        if (!is_current_valid) {
            return {
                status: 401,
                data: {
                    message: 'Current password is incorrect'
                }
            };
        }

        await with_timeout(
            DB('users')
                .where({ id: user.id })
                .update({ password: BCRYPT.encrypt(new_password) })
        );

        LOGGER.module().info('Password updated successfully for user ID: ' + user.id);

        return {
            status: 204,
            data: null
        };

    } catch (error) {
        return handle_error(error, 'Unable to update password');
    }
};

/**
 * Regenerates API key for user
 * @param {Object} req - Request object
 * @returns {Promise<Object>} - Response object with status and data
 */
exports.regenerate_api_key = async function (req) {
    try {
        const api_key = extract_api_key(req.query);

        if (!api_key) {
            return {
                status: 400,
                data: {
                    message: 'Invalid or missing API key'
                }
            };
        }

        const new_api_key = KEYGEN();

        const rows_updated = await with_timeout(
            DB('users')
                .where({ api_key: api_key })
                .update({ api_key: new_api_key })
        );

        if (rows_updated === 0) {
            return {
                status: 404,
                data: {
                    message: 'User not found'
                }
            };
        }

        LOGGER.module().info('API key regenerated successfully');

        return {
            status: 200,
            data: {
                api_key: new_api_key
            }
        };

    } catch (error) {
        return handle_error(error, 'Unable to regenerate API key');
    }
};

/**
 * Deletes user account
 * @param {Object} req - Request object
 * @returns {Promise<Object>} - Response object with status and data
 */
exports.delete_account = async function (req) {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return {
                status: 400,
                data: {
                    message: 'Bad request: missing request body'
                }
            };
        }

        const api_key = extract_api_key(req.query);

        if (!api_key) {
            return {
                status: 400,
                data: {
                    message: 'Invalid or missing API key'
                }
            };
        }

        const { password } = req.body;

        if (!password || typeof password !== 'string') {
            return {
                status: 400,
                data: {
                    message: 'Password confirmation required'
                }
            };
        }

        const user = await with_timeout(
            DB('users')
                .where({ api_key: api_key })
                .select('id', 'username', 'password')
                .first()
        );

        if (!user) {
            return {
                status: 404,
                data: {
                    message: 'User not found'
                }
            };
        }

        const is_password_valid = BCRYPT.verify(password, user.password);

        if (!is_password_valid) {
            return {
                status: 401,
                data: {
                    message: 'Invalid password'
                }
            };
        }

        await with_timeout(
            DB('users')
                .where({ id: user.id })
                .del()
        );

        LOGGER.module().info('User account deleted: ' + user.username);

        return {
            status: 204,
            data: null
        };

    } catch (error) {
        return handle_error(error, 'Unable to delete account');
    }
};