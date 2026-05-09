/**
 Copyright 2021 fernando.reyes@du.edu

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * ICT4510 final project example
 * Dashboard page module - refactored for security, efficiency, and reliability
 */

const dashboardModule = (function () {
    'use strict';

    /* ------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------ */
    const MESSAGE_TIMEOUT_MS = 3000;
    const ERROR_TIMEOUT_MS = 7000;
    const AVATAR_IMAGES = Object.freeze([
        'avatar1.png',
        'avatar2.png',
        'avatar3.png',
        'avatar4.png',
        'avatar5.png'
    ]);

    /* ------------------------------------------------------------------
     * State
     * ------------------------------------------------------------------ */
    let cached_user = null;
    let is_submitting = false;
    let message_timeout_id = null;
    let abort_controller = null;

    /* ------------------------------------------------------------------
     * DOM cache - initialized lazily to ensure DOM is ready
     * ------------------------------------------------------------------ */
    let dom = null;

    function get_dom() {
        if (dom !== null) {
            return dom;
        }

        dom = {
            user_image: document.querySelector('#user-image'),
            profile_user: document.querySelector('#profile-user'),
            profile_username: document.querySelector('#profile-username'),
            profile_api_key: document.querySelector('#profile-api-key'),
            menu_items: document.querySelector('#menu-items'),
            menu: document.querySelector('#menu'),
            message: document.querySelector('#message'),
            item_id: document.querySelector('#item-id'),
            item: document.querySelector('#item'),
            description: document.querySelector('#description'),
            price: document.querySelector('#price'),
            form_mode: document.querySelector('#form-mode'),
            save_button: document.querySelector('#save-menu-item-button'),
            delete_button: document.querySelector('#delete-menu-item-button'),
            delete_toggle: document.querySelector('#toggle-delete-button'),
            logout_link: document.querySelector('#logout-link')
        };

        return dom;
    }

    /* ------------------------------------------------------------------
     * Security utilities
     * ------------------------------------------------------------------ */

    /**
     * Escapes HTML special characters to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text safe for display
     */
    function escape_html(text) {
        if (typeof text !== 'string') {
            return '';
        }

        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    /**
     * Sanitizes user input by trimming and limiting length
     * @param {string} value - Input value
     * @param {number} max_length - Maximum allowed length
     * @returns {string} Sanitized value
     */
    function sanitize_input(value, max_length) {
        const effective_max_length = max_length || 500;

        if (typeof value !== 'string') {
            return '';
        }

        return value.trim().slice(0, effective_max_length);
    }

    /**
     * Validates price format (positive number with up to 2 decimal places)
     * @param {string} price - Price string to validate
     * @returns {boolean} True if valid price format
     */
    function is_valid_price(price) {
        if (typeof price !== 'string' || !price.trim()) {
            return false;
        }

        const price_pattern = /^\d+(\.\d{1,2})?$/;
        const trimmed = price.trim();

        if (!price_pattern.test(trimmed)) {
            return false;
        }

        const num_value = parseFloat(trimmed);
        return !isNaN(num_value) && num_value >= 0 && num_value <= 99999.99;
    }

    /* ------------------------------------------------------------------
     * Storage utilities
     * ------------------------------------------------------------------ */

    /**
     * Safely retrieves and parses user data from localStorage
     * @returns {Object|null} User object or null if not found/invalid
     */
    function get_user() {
        if (cached_user !== null) {
            return cached_user;
        }

        try {
            const stored = window.localStorage.getItem('user');

            if (!stored) {
                return null;
            }

            const parsed = JSON.parse(stored);

            if (!parsed || typeof parsed !== 'object') {
                return null;
            }

            if (!parsed.user || typeof parsed.user !== 'object') {
                return null;
            }

            const user_data = parsed.user;
            const required_fields = ['api_key', 'token', 'first_name', 'last_name', 'username'];

            for (let i = 0; i < required_fields.length; i++) {
                if (typeof user_data[required_fields[i]] !== 'string') {
                    return null;
                }
            }

            cached_user = parsed;
            return cached_user;
        } catch (e) {
            return null;
        }
    }

    /**
     * Clears user data and redirects to login
     */
    function logout() {
        try {
            cached_user = null;
            window.localStorage.removeItem('user');
        } catch (e) {
            // Storage may be unavailable; continue with redirect
        }

        window.location.replace('/login');
    }

    /* ------------------------------------------------------------------
     * API endpoint builder
     * ------------------------------------------------------------------ */

    /**
     * Builds the menu API endpoint URL
     * @param {string} item_id - Optional item ID for specific item operations
     * @returns {string|null} API endpoint URL or null if user not authenticated
     */
    function build_menu_endpoint(item_id) {
        const user = get_user();

        if (!user || !user.user || !user.user.api_key) {
            return null;
        }

        const base_url = configModule.get_api_url();
        let url = base_url + 'api/menus?api_key=' + encodeURIComponent(user.user.api_key);

        if (item_id) {
            url += '&id=' + encodeURIComponent(item_id);
        }

        return url;
    }

    /* ------------------------------------------------------------------
     * Message display
     * ------------------------------------------------------------------ */

    /**
     * Displays a message to the user
     * @param {string} text - Message text (will be escaped)
     * @param {string} type - Message type: 'success', 'danger', 'info', 'warning'
     * @param {number} timeout - Auto-hide timeout in ms (0 for persistent)
     */
    function show_message(text, type, timeout) {
        const effective_type = type || 'info';
        const effective_timeout = typeof timeout === 'number' ? timeout : MESSAGE_TIMEOUT_MS;

        const elements = get_dom();

        if (!elements.message) {
            return;
        }

        if (message_timeout_id) {
            clearTimeout(message_timeout_id);
            message_timeout_id = null;
        }

        // Clear existing content safely
        while (elements.message.firstChild) {
            elements.message.removeChild(elements.message.firstChild);
        }

        const alert_div = document.createElement('div');
        alert_div.className = 'alert alert-' + effective_type;
        alert_div.setAttribute('role', 'alert');
        alert_div.textContent = text;

        elements.message.appendChild(alert_div);

        if (effective_timeout > 0) {
            message_timeout_id = setTimeout(function () {
                clear_message();
            }, effective_timeout);
        }
    }

    /**
     * Displays multiple error messages
     * @param {Array<string>} errors - Array of error message strings
     */
    function show_error_list(errors) {
        const elements = get_dom();

        if (!elements.message || !Array.isArray(errors)) {
            return;
        }

        if (message_timeout_id) {
            clearTimeout(message_timeout_id);
            message_timeout_id = null;
        }

        while (elements.message.firstChild) {
            elements.message.removeChild(elements.message.firstChild);
        }

        const alert_div = document.createElement('div');
        alert_div.className = 'alert alert-danger';
        alert_div.setAttribute('role', 'alert');

        const ul = document.createElement('ul');
        ul.className = 'mb-0';

        for (let i = 0; i < errors.length; i++) {
            const li = document.createElement('li');
            li.textContent = errors[i];
            ul.appendChild(li);
        }

        alert_div.appendChild(ul);
        elements.message.appendChild(alert_div);

        message_timeout_id = setTimeout(function () {
            clear_message();
        }, ERROR_TIMEOUT_MS);
    }

    /**
     * Clears the message display area
     */
    function clear_message() {
        const elements = get_dom();

        if (!elements.message) {
            return;
        }

        while (elements.message.firstChild) {
            elements.message.removeChild(elements.message.firstChild);
        }
    }

    /* ------------------------------------------------------------------
     * HTTP utilities
     * ------------------------------------------------------------------ */

    /**
     * Creates fetch options with timeout and abort support
     * @param {Object} options - Fetch options
     * @returns {Object} Enhanced fetch options
     */
    function create_fetch_options(options) {
        const effective_options = options || {};

        // Cancel any in-flight request
        if (abort_controller) {
            abort_controller.abort();
        }

        abort_controller = new AbortController();

        const timeout_id = setTimeout(function () {
            if (abort_controller) {
                abort_controller.abort();
            }
        }, configModule.get_timeout());

        const fetch_options = {
            signal: abort_controller.signal,
            credentials: 'same-origin'
        };

        // Merge provided options
        const keys = Object.keys(effective_options);
        for (let i = 0; i < keys.length; i++) {
            fetch_options[keys[i]] = effective_options[keys[i]];
        }

        fetch_options._timeout_id = timeout_id;

        return fetch_options;
    }

    /**
     * Performs a fetch request with error handling
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Object|null>} Response data or null for 204
     */
    function fetch_json(url, options) {
        if (!configModule.is_valid_api_url(url)) {
            return Promise.reject({ status: 0, message: 'Invalid API URL' });
        }

        const fetch_options = create_fetch_options(options);
        const timeout_id = fetch_options._timeout_id;
        delete fetch_options._timeout_id;

        return fetch(url, fetch_options)
            .then(function (response) {
                clearTimeout(timeout_id);

                if (response.status === 204) {
                    return null;
                }

                if (!response.ok) {
                    return response.json()
                        .catch(function () {
                            return {};
                        })
                        .then(function (data) {
                            const error = new Error('Request failed');
                            error.status = response.status;
                            error.data = data;
                            throw error;
                        });
                }

                return response.json();
            })
            .catch(function (error) {
                clearTimeout(timeout_id);

                if (error.name === 'AbortError') {
                    const timeout_error = new Error('Request timed out');
                    timeout_error.status = 0;
                    timeout_error.is_timeout = true;
                    throw timeout_error;
                }

                throw error;
            });
    }

    /* ------------------------------------------------------------------
     * Profile display
     * ------------------------------------------------------------------ */

    /**
     * Displays user profile information
     */
    function display_profile_info() {
        const user = get_user();
        const elements = get_dom();

        if (!user || !user.user) {
            return;
        }

        const user_data = user.user;

        if (elements.user_image) {
            const index = Math.floor(Math.random() * AVATAR_IMAGES.length);
            elements.user_image.src = 'admin-assets/img/' + AVATAR_IMAGES[index];
            elements.user_image.alt = 'User avatar';
        }

        if (elements.profile_user) {
            elements.profile_user.textContent =
                escape_html(user_data.first_name) + ' ' + escape_html(user_data.last_name);
        }

        if (elements.profile_username) {
            elements.profile_username.textContent = 'Username: ' + escape_html(user_data.username);
        }

        if (elements.profile_api_key) {
            // Mask API key for display (show first 4 and last 4 chars)
            /*
            const api_key = user_data.api_key || '';
            const masked_key = api_key.length > 8
                ? api_key.slice(0, 4) + '****' + api_key.slice(-4)
                : '********';
            elements.profile_api_key.textContent = 'API KEY: ' + masked_key;
             */
            elements.profile_api_key.textContent = 'API KEY: ' + user_data.api_key;
        }
    }

    /* ------------------------------------------------------------------
     * Menu rendering
     * ------------------------------------------------------------------ */

    /**
     * Creates a table row element for a menu item
     * @param {Object} item - Menu item data
     * @returns {HTMLTableRowElement} Table row element
     */
    function create_menu_row(item) {
        const tr = document.createElement('tr');

        // Edit cell
        const edit_cell = document.createElement('td');
        const edit_link = document.createElement('a');
        edit_link.href = '#';
        edit_link.className = 'edit-menu-item';
        edit_link.setAttribute('data-id', item.id);
        edit_link.setAttribute('aria-label', 'Edit menu item: ' + escape_html(item.item));

        const icon = document.createElement('i');
        icon.className = 'fa fa-edit';
        icon.setAttribute('aria-hidden', 'true');

        edit_link.appendChild(icon);
        edit_cell.appendChild(edit_link);

        // Item cell
        const item_cell = document.createElement('td');
        item_cell.textContent = item.item;

        // Description cell
        const desc_cell = document.createElement('td');
        desc_cell.textContent = item.description;

        // Price cell
        const price_cell = document.createElement('td');
        price_cell.textContent = item.price;

        tr.appendChild(edit_cell);
        tr.appendChild(item_cell);
        tr.appendChild(desc_cell);
        tr.appendChild(price_cell);

        // Attach click handler
        edit_link.addEventListener('click', function (e) {
            e.preventDefault();
            const id = this.getAttribute('data-id');
            if (id) {
                edit_menu_item(id);
            }
        });

        return tr;
    }

    /**
     * Displays menu items in the table
     * @param {Array} menu - Array of menu item objects
     */
    function display_menu_items(menu) {
        const elements = get_dom();

        if (!elements.menu_items) {
            return;
        }

        // Clear existing rows
        elements.menu_items.innerHTML = '';

        // Remove any existing empty-state message
        const existing_alert = elements.menu ? elements.menu.querySelector('.alert-info.empty-menu-message') : null;
        if (existing_alert) {
            existing_alert.parentNode.removeChild(existing_alert);
        }

        if (!Array.isArray(menu) || menu.length === 0) {
            if (elements.menu) {
                const alert_div = document.createElement('div');
                alert_div.className = 'alert alert-info empty-menu-message';

                const small = document.createElement('small');
                small.textContent = 'Sorry! No daily menu today.';

                alert_div.appendChild(small);

                const table = elements.menu.querySelector('table');
                if (table) {
                    elements.menu.insertBefore(alert_div, table);
                } else {
                    elements.menu.appendChild(alert_div);
                }
            }
            return;
        }

        // Append rows to menu_items
        menu.forEach(function (item) {
            if (item && item.id !== undefined && item.id !== null) {
                const row = create_menu_row(item);
                elements.menu_items.appendChild(row);
            }
        });
    }

    /* ------------------------------------------------------------------
     * API operations
     * ------------------------------------------------------------------ */

    /**
     * Fetches and displays menu items
     */
    function get_menu_items() {
        const endpoint = build_menu_endpoint();

        if (!endpoint) {
            logout();
            return;
        }

        fetch_json(endpoint)
            .then(function (json) {
                if (json && json.menu) {
                    display_menu_items(json.menu);
                } else {
                    display_menu_items([]);
                }
            })
            .catch(function (err) {
                const message = err.is_timeout
                    ? 'Request timed out. Please try again.'
                    : 'Failed to load menu.';
                show_message(message, 'danger');
            });
    }

    /**
     * Validates form data before submission
     * @returns {Object|null} Validated payload or null if invalid
     */
    function validate_form_data() {
        const elements = get_dom();
        const errors = [];

        const item_value = sanitize_input(elements.item.value, 100);
        const description_value = sanitize_input(elements.description.value, 500);
        const price_value = sanitize_input(elements.price.value, 10);

        if (!item_value) {
            errors.push('Item name is required.');
        }

        if (!description_value) {
            errors.push('Description is required.');
        }

        if (!price_value) {
            errors.push('Price is required.');
        } else if (!is_valid_price(price_value)) {
            errors.push('Price must be a valid number (e.g., 9.99).');
        }

        if (errors.length > 0) {
            show_error_list(errors);
            return null;
        }

        return {
            item: item_value,
            description: description_value,
            price: price_value
        };
    }

    /**
     * Saves a new menu item
     */
    function save_menu_item() {
        if (is_submitting) {
            return;
        }

        const payload = validate_form_data();

        if (!payload) {
            return;
        }

        const endpoint = build_menu_endpoint();
        const user = get_user();

        if (!endpoint || !user) {
            logout();
            return;
        }

        is_submitting = true;
        set_form_loading(true);

        fetch_json(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': user.user.token
            },
            body: JSON.stringify(payload)
        })
            .then(function () {
                clear_form();
                show_message('Menu Item Saved!', 'success');
                get_menu_items();
            })
            .catch(function (err) {
                handle_form_errors(err, 'Menu Item NOT Saved');
            })
            .finally(function () {
                is_submitting = false;
                set_form_loading(false);
            });
    }

    /**
     * Updates an existing menu item
     */
    function update_menu_item() {
        if (is_submitting) {
            return;
        }

        const elements = get_dom();
        const payload = validate_form_data();

        if (!payload) {
            return;
        }

        const item_id = sanitize_input(elements.item_id.value, 50);

        if (!item_id) {
            show_message('Invalid item ID.', 'danger');
            return;
        }

        payload.id = item_id;

        const endpoint = build_menu_endpoint();
        const user = get_user();

        if (!endpoint || !user) {
            logout();
            return;
        }

        is_submitting = true;
        set_form_loading(true);

        fetch_json(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': user.user.token
            },
            body: JSON.stringify(payload)
        })
            .then(function () {
                reset_form_state();
                show_message('Menu Item Updated!', 'success');
                get_menu_items();
            })
            .catch(function (err) {
                handle_form_errors(err, 'Menu Item NOT Updated');
            })
            .finally(function () {
                is_submitting = false;
                set_form_loading(false);
            });
    }

    /**
     * Deletes a menu item
     */
    function delete_menu_item() {
        if (is_submitting) {
            return;
        }

        const elements = get_dom();
        const item_id = sanitize_input(elements.item_id.value, 50);

        if (!item_id) {
            show_message('Invalid item ID.', 'danger');
            return;
        }

        const endpoint = build_menu_endpoint(item_id);
        const user = get_user();

        if (!endpoint || !user) {
            logout();
            return;
        }

        is_submitting = true;
        set_form_loading(true);

        fetch_json(endpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': user.user.token
            }
        })
            .then(function () {
                reset_form_state();
                show_message('Menu Item Deleted!', 'success');
                get_menu_items();
            })
            .catch(function (err) {
                handle_form_errors(err, 'Menu Item NOT Deleted');
            })
            .finally(function () {
                is_submitting = false;
                set_form_loading(false);
            });
    }

    /* ------------------------------------------------------------------
     * Form helpers
     * ------------------------------------------------------------------ */

    /**
     * Handles API errors and displays appropriate messages
     * @param {Error} err - Error object from fetch
     * @param {string} fallback_message - Default message if no specific errors
     */
    function handle_form_errors(err, fallback_message) {
        if (err.is_timeout) {
            show_message('Request timed out. Please try again.', 'danger');
            return;
        }

        if (err.data && err.data.errors && Array.isArray(err.data.errors)) {
            const messages = err.data.errors.map(function (e) {
                return e.message || 'Unknown error';
            });
            show_error_list(messages);
        } else {
            show_message(fallback_message, 'danger');
        }
    }

    /**
     * Clears form input fields
     */
    function clear_form() {
        const elements = get_dom();

        if (elements.item) {
            elements.item.value = '';
        }

        if (elements.description) {
            elements.description.value = '';
        }

        if (elements.price) {
            elements.price.value = '';
        }
    }

    /**
     * Resets form to initial "Add" state
     */
    function reset_form_state() {
        const elements = get_dom();

        clear_form();

        if (elements.item_id) {
            elements.item_id.value = '';
        }

        if (elements.form_mode) {
            elements.form_mode.textContent = 'Add Menu Item';
        }

        if (elements.delete_toggle) {
            elements.delete_toggle.style.visibility = 'hidden';
        }

        bind_save_handler();
    }

    /**
     * Sets form loading state
     * @param {boolean} loading - Whether form is in loading state
     */
    function set_form_loading(loading) {
        const elements = get_dom();

        if (elements.save_button) {
            elements.save_button.disabled = loading;
        }

        if (elements.delete_button) {
            elements.delete_button.disabled = loading;
        }
    }

    /* ------------------------------------------------------------------
     * Edit menu item
     * ------------------------------------------------------------------ */

    /**
     * Loads a menu item for editing
     * @param {string} id - Menu item ID
     */
    function edit_menu_item(id) {
        const sanitized_id = sanitize_input(id, 50);

        if (!sanitized_id) {
            show_message('Invalid item ID.', 'danger');
            return;
        }

        const endpoint = build_menu_endpoint(sanitized_id);

        if (!endpoint) {
            logout();
            return;
        }

        fetch_json(endpoint)
            .then(function (json) {
                if (!json || !json.menu || !Array.isArray(json.menu) || json.menu.length === 0) {
                    show_message('Menu item not found.', 'danger');
                    return;
                }

                const item = json.menu[json.menu.length - 1];
                const elements = get_dom();

                if (elements.form_mode) {
                    elements.form_mode.textContent = 'Edit Menu Item';
                }

                if (elements.delete_toggle) {
                    elements.delete_toggle.style.visibility = 'visible';
                }

                if (elements.item_id) {
                    elements.item_id.value = item.id;
                }

                if (elements.item) {
                    elements.item.value = item.item || '';
                }

                if (elements.description) {
                    elements.description.value = item.description || '';
                }

                if (elements.price) {
                    elements.price.value = item.price || '';
                }

                bind_update_handler();
                bind_delete_handler();
            })
            .catch(function () {
                show_message('Unable to load menu item.', 'danger');
            });
    }

    /* ------------------------------------------------------------------
     * Event binding
     * ------------------------------------------------------------------ */

    /**
     * Binds save handler to save button
     */
    function bind_save_handler() {
        const elements = get_dom();

        if (!elements.save_button) {
            return;
        }

        // Remove existing listeners by cloning
        const new_button = elements.save_button.cloneNode(true);
        elements.save_button.parentNode.replaceChild(new_button, elements.save_button);
        dom.save_button = new_button;

        new_button.addEventListener('click', function (e) {
            e.preventDefault();
            save_menu_item();
        });
    }

    /**
     * Binds update handler to save button
     */
    function bind_update_handler() {
        const elements = get_dom();

        if (!elements.save_button) {
            return;
        }

        const new_button = elements.save_button.cloneNode(true);
        elements.save_button.parentNode.replaceChild(new_button, elements.save_button);
        dom.save_button = new_button;

        new_button.addEventListener('click', function (e) {
            e.preventDefault();
            update_menu_item();
        });
    }

    /**
     * Binds delete handler to delete button
     */
    function bind_delete_handler() {
        const elements = get_dom();

        if (!elements.delete_button) {
            return;
        }

        const new_button = elements.delete_button.cloneNode(true);
        elements.delete_button.parentNode.replaceChild(new_button, elements.delete_button);
        dom.delete_button = new_button;

        new_button.addEventListener('click', function (e) {
            e.preventDefault();
            delete_menu_item();
        });
    }

    /**
     * Binds logout handler
     */
    function bind_logout_handler() {
        const elements = get_dom();

        if (!elements.logout_link) {
            return;
        }

        elements.logout_link.addEventListener('click', function (e) {
            e.preventDefault();
            logout();
        });
    }

    /* ------------------------------------------------------------------
     * Public API
     * ------------------------------------------------------------------ */
    const api = {

        /**
         * Loads a menu item for editing (public method)
         * @param {string} id - Menu item ID
         */
        edit_menu_item: edit_menu_item,

        /**
         * Initializes the dashboard module
         */
        init: function () {
            // Ensure DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function () {
                    api.init();
                });
                return;
            }

            const user = get_user();

            if (!user) {
                logout();
                return;
            }

            display_profile_info();
            get_menu_items();
            bind_save_handler();
            bind_logout_handler();

            const elements = get_dom();

            if (elements.delete_toggle) {
                elements.delete_toggle.style.visibility = 'hidden';
            }
        }
    };

    return api;

}());

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        dashboardModule.init();
    });
} else {
    dashboardModule.init();
}
