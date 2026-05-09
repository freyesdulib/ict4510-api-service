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
const LOGGER = require('../libs/log4');

/**
 * Configuration constants
 * Aligned with database schema:
 * - item: varchar(255)
 * - description: text
 * - price: varchar(50)
 * - api_key: varchar(255)
 * @type {Readonly<Object>}
 */
const CONFIG = Object.freeze({
    DB_TIMEOUT_MS: 5000,
    ITEM_NAME_MIN_LENGTH: 1,
    ITEM_NAME_MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 65535,
    PRICE_MAX_LENGTH: 50,
    MAX_RESULTS: 1000,
    ALLOWED_MENU_FIELDS: ['item', 'description', 'price']
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
     * Validates positive integer ID
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
    },

    /**
     * Validates price value (stored as varchar in database)
     * Accepts numeric strings or numbers, validates format
     * @param {*} value - Value to validate
     * @returns {boolean}
     */
    is_valid_price(value) {
        if (value === null || value === undefined) {
            return false;
        }

        const str_value = String(value).trim();

        if (str_value.length === 0 || str_value.length > CONFIG.PRICE_MAX_LENGTH) {
            return false;
        }

        // Allow numeric values with optional decimal
        const price_pattern = /^\d+(\.\d{1,2})?$/;
        return price_pattern.test(str_value);
    },

    /**
     * Validates menu item name
     * @param {string} item - Item name to validate
     * @returns {boolean}
     */
    is_valid_item_name(item) {
        return this.is_valid_string(item, CONFIG.ITEM_NAME_MIN_LENGTH, CONFIG.ITEM_NAME_MAX_LENGTH);
    },

    /**
     * Validates description (TEXT field in database)
     * @param {string} description - Description to validate
     * @returns {boolean}
     */
    is_valid_description(description) {
        if (description === null || description === undefined) {
            return true;
        }
        if (typeof description !== 'string') {
            return false;
        }
        return description.length <= CONFIG.DESCRIPTION_MAX_LENGTH;
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
 * Extracts and validates ID from request query
 * @param {Object} query - Request query object
 * @returns {number|null} - Validated ID or null
 */
function extract_id(query) {
    if (!query || typeof query !== 'object') {
        return null;
    }

    let id = query.id;

    if (Array.isArray(id)) {
        id = id[id.length - 1];
    }

    if (!validators.is_valid_id(id)) {
        return null;
    }

    return parseInt(id, 10);
}

/**
 * Sanitizes menu data for database operations
 * Only allows fields that exist in database schema: item, description, price
 * @param {Object} menu_data - Raw menu data
 * @returns {Object} - Sanitized menu data
 */
function sanitize_menu_data(menu_data) {
    const sanitized = {};

    if (Object.prototype.hasOwnProperty.call(menu_data, 'item') && menu_data.item !== undefined) {
        if (typeof menu_data.item === 'string') {
            sanitized.item = menu_data.item.trim().substring(0, CONFIG.ITEM_NAME_MAX_LENGTH);
        }
    }

    if (Object.prototype.hasOwnProperty.call(menu_data, 'description')) {
        if (typeof menu_data.description === 'string') {
            sanitized.description = menu_data.description.trim();
        } else {
            sanitized.description = '';
        }
    }

    if (Object.prototype.hasOwnProperty.call(menu_data, 'price') && menu_data.price !== undefined) {
        // Store price as string (varchar in database)
        const price_str = String(menu_data.price).trim();
        if (price_str.length <= CONFIG.PRICE_MAX_LENGTH) {
            sanitized.price = price_str;
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
 * Saves menu item to database
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

        const api_key = extract_api_key(req.query);

        if (!api_key) {
            return {
                status: 400,
                data: {
                    message: 'Invalid or missing API key'
                }
            };
        }

        const { item, description, price } = req.body;

        if (!validators.is_valid_item_name(item)) {
            return {
                status: 400,
                data: {
                    message: 'Invalid item name: must be 1-255 characters'
                }
            };
        }

        if (!validators.is_valid_description(description)) {
            return {
                status: 400,
                data: {
                    message: 'Invalid description format'
                }
            };
        }

        if (!validators.is_valid_price(price)) {
            return {
                status: 400,
                data: {
                    message: 'Invalid price: must be a valid price format (e.g., 10.99)'
                }
            };
        }

        const menu_record = {
            item: item.trim().substring(0, CONFIG.ITEM_NAME_MAX_LENGTH),
            description: description ? description.trim() : '',
            price: String(price).trim(),
            api_key: api_key
        };

        const [inserted_id] = await with_timeout(
            DB('menus').insert(menu_record)
        );

        LOGGER.module().info('Menu item created successfully: ID ' + inserted_id);

        return {
            status: 201,
            data: {
                message: 'Menu item created successfully',
                id: inserted_id
            }
        };

    } catch (error) {
        return handle_error(error, 'Unable to create menu item');
    }
};

/**
 * Gets menu items by user API key, optionally filtered by ID
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

        const where_clause = { api_key: api_key };

        const id = extract_id(req.query);
        if (id !== null) {
            where_clause.id = id;
        }


        const menu_items = await with_timeout(
            DB('menus')
                .where(where_clause)
                .select('id', 'item', 'description', 'price')
                .limit(CONFIG.MAX_RESULTS)
        );

        if (id !== null && menu_items.length === 0) {
            return {
                status: 404,
                data: {
                    message: 'Menu item not found'
                }
            };
        }

        return {
            status: 200,
            data: {
                menu: menu_items
            }
        };

    } catch (error) {
        return handle_error(error, 'Unable to retrieve menu items');
    }
};

/**
 * Updates menu item data by ID and user API key
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

        const menu_id = req.body.id;

        if (!validators.is_valid_id(menu_id)) {
            return {
                status: 400,
                data: {
                    message: 'Invalid menu item ID'
                }
            };
        }

        if (req.body.item !== undefined && !validators.is_valid_item_name(req.body.item)) {
            return {
                status: 400,
                data: {
                    message: 'Invalid item name: must be 1-255 characters'
                }
            };
        }

        if (req.body.description !== undefined && !validators.is_valid_description(req.body.description)) {
            return {
                status: 400,
                data: {
                    message: 'Invalid description format'
                }
            };
        }

        if (req.body.price !== undefined && !validators.is_valid_price(req.body.price)) {
            return {
                status: 400,
                data: {
                    message: 'Invalid price: must be a valid price format (e.g., 10.99)'
                }
            };
        }

        const update_data = sanitize_menu_data(req.body);

        if (Object.keys(update_data).length === 0) {
            return {
                status: 400,
                data: {
                    message: 'No valid fields to update'
                }
            };
        }

        const rows_updated = await with_timeout(
            DB('menus')
                .where({
                    api_key: api_key,
                    id: menu_id
                })
                .update(update_data)
        );

        if (rows_updated === 0) {
            return {
                status: 404,
                data: {
                    message: 'Menu item not found or unauthorized'
                }
            };
        }

        LOGGER.module().info('Menu item updated successfully: ID ' + menu_id);

        return {
            status: 204,
            data: null
        };

    } catch (error) {
        return handle_error(error, 'Unable to update menu item');
    }
};

/**
 * Deletes menu item by ID and user API key
 * @param {Object} req - Request object
 * @returns {Promise<Object>} - Response object with status and data
 */
exports.delete_item = async function (req) {
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

        const id = extract_id(req.query);

        if (id === null) {
            return {
                status: 400,
                data: {
                    message: 'Invalid or missing menu item ID'
                }
            };
        }

        const rows_deleted = await with_timeout(
            DB('menus')
                .where({
                    api_key: api_key,
                    id: id
                })
                .del()
        );

        if (rows_deleted === 0) {
            return {
                status: 404,
                data: {
                    message: 'Menu item not found or unauthorized'
                }
            };
        }

        LOGGER.module().info('Menu item deleted successfully: ID ' + id);

        return {
            status: 204,
            data: null
        };

    } catch (error) {
        return handle_error(error, 'Unable to delete menu item');
    }
};

/**
 * Bulk retrieves menu items by multiple IDs
 * @param {Object} req - Request object
 * @returns {Promise<Object>} - Response object with status and data
 */
exports.read_bulk = async function (req) {
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

        if (!req.body || !Array.isArray(req.body.ids)) {
            return {
                status: 400,
                data: {
                    message: 'Invalid request: ids array required'
                }
            };
        }

        const valid_ids = req.body.ids
            .filter(id => validators.is_valid_id(id))
            .map(id => parseInt(id, 10))
            .slice(0, CONFIG.MAX_RESULTS);

        if (valid_ids.length === 0) {
            return {
                status: 400,
                data: {
                    message: 'No valid IDs provided'
                }
            };
        }

        const menu_items = await with_timeout(
            DB('menus')
                .where({ api_key: api_key })
                .whereIn('id', valid_ids)
                .select('id', 'item', 'description', 'price')
        );

        return {
            status: 200,
            data: {
                menu: menu_items,
                requested_count: valid_ids.length,
                found_count: menu_items.length
            }
        };

    } catch (error) {
        return handle_error(error, 'Unable to retrieve menu items');
    }
};

/**
 * Searches menu items by item name or description
 * @param {Object} req - Request object
 * @returns {Promise<Object>} - Response object with status and data
 */
exports.search = async function (req) {
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

        let search_term = req.query.q;

        if (Array.isArray(search_term)) {
            search_term = search_term[search_term.length - 1];
        }

        if (!search_term || typeof search_term !== 'string' || search_term.trim().length === 0) {
            return {
                status: 400,
                data: {
                    message: 'Search term required'
                }
            };
        }

        const sanitized_term = search_term.trim().substring(0, 100);
        const like_pattern = '%' + sanitized_term + '%';

        const menu_items = await with_timeout(
            DB('menus')
                .where({ api_key: api_key })
                .andWhere(function () {
                    this.where('item', 'like', like_pattern)
                        .orWhere('description', 'like', like_pattern);
                })
                .select('id', 'item', 'description', 'price')
                .limit(CONFIG.MAX_RESULTS)
        );

        return {
            status: 200,
            data: {
                menu: menu_items,
                search_term: sanitized_term,
                count: menu_items.length
            }
        };

    } catch (error) {
        return handle_error(error, 'Unable to search menu items');
    }
};