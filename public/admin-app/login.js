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
 * Login page module - refactored for security, efficiency, and reliability
 */

const loginModule = (function () {

    'use strict';

    /* ------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------ */
    const LOGIN_ENDPOINT = configModule.get_api_url() + 'api/login';
    const REDIRECT_DELAY_MS = 2000;
    const REQUEST_TIMEOUT_MS = 10000;
    const USERNAME_MAX_LENGTH = 100;
    const PASSWORD_MAX_LENGTH = 128;

    /* ------------------------------------------------------------------
     * State
     * ------------------------------------------------------------------ */
    let is_submitting = false;
    let abort_controller = null;

    /* ------------------------------------------------------------------
     * DOM cache - initialized lazily
     * ------------------------------------------------------------------ */
    let dom = null;

    function get_dom() {
        if (dom !== null) {
            return dom;
        }

        dom = {
            message: document.querySelector('#message'),
            username: document.querySelector('#username'),
            password: document.querySelector('#password'),
            card: document.querySelector('.card'),
            login_button: document.querySelector('#login-button')
        };

        return dom;
    }

    /* ------------------------------------------------------------------
     * Security utilities
     * ------------------------------------------------------------------ */

    /**
     * Sanitizes user input by trimming and limiting length
     * @param {string} value - Input value
     * @param {number} max_length - Maximum allowed length
     * @returns {string} Sanitized value
     */
    function sanitize_input(value, max_length) {
        if (typeof value !== 'string') {
            return '';
        }

        return value.trim().slice(0, max_length);
    }

    /**
     * Validates username format
     * @param {string} username - Username to validate
     * @returns {boolean} True if valid
     */
    function is_valid_username(username) {
        if (typeof username !== 'string' || username.length === 0) {
            return false;
        }

        // Allow alphanumeric, underscores, hyphens, periods, and @ for email-style usernames
        const username_pattern = /^[a-zA-Z0-9._@-]+$/;
        return username_pattern.test(username) && username.length <= USERNAME_MAX_LENGTH;
    }

    /**
     * Validates password is present and within length limits
     * @param {string} password - Password to validate
     * @returns {boolean} True if valid
     */
    function is_valid_password(password) {
        return typeof password === 'string' &&
            password.length > 0 &&
            password.length <= PASSWORD_MAX_LENGTH;
    }

    /* ------------------------------------------------------------------
     * Message display
     * ------------------------------------------------------------------ */

    /**
     * Displays a message to the user using safe DOM methods
     * @param {string} text - Message text
     * @param {string} type - Message type: 'success', 'danger', 'info', 'warning'
     */
    function show_message(text, type) {
        const elements = get_dom();

        if (!elements.message) {
            return;
        }

        // Clear existing content safely
        while (elements.message.firstChild) {
            elements.message.removeChild(elements.message.firstChild);
        }

        const alert_div = document.createElement('div');
        alert_div.className = 'alert alert-' + type;
        alert_div.setAttribute('role', 'alert');
        alert_div.textContent = text;

        elements.message.appendChild(alert_div);
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
     * Form utilities
     * ------------------------------------------------------------------ */

    /**
     * Clears the login form fields
     */
    function clear_form() {
        const elements = get_dom();

        if (elements.username) {
            elements.username.value = '';
        }

        if (elements.password) {
            elements.password.value = '';
        }
    }

    /**
     * Hides the login card
     */
    function hide_card() {
        const elements = get_dom();

        if (elements.card) {
            elements.card.style.display = 'none';
        }
    }

    /**
     * Sets the loading state of the form
     * @param {boolean} loading - Whether form is in loading state
     */
    function set_loading(loading) {
        const elements = get_dom();

        if (elements.login_button) {
            elements.login_button.disabled = loading;
        }

        if (elements.username) {
            elements.username.disabled = loading;
        }

        if (elements.password) {
            elements.password.disabled = loading;
        }
    }

    /* ------------------------------------------------------------------
     * Authentication
     * ------------------------------------------------------------------ */

    /**
     * Validates form inputs before submission
     * @returns {Object|null} Validated credentials or null if invalid
     */
    function validate_credentials() {
        const elements = get_dom();

        if (!elements.username || !elements.password) {
            show_message('Form elements not found.', 'danger');
            return null;
        }

        const username = sanitize_input(elements.username.value, USERNAME_MAX_LENGTH);
        const password = elements.password.value.slice(0, PASSWORD_MAX_LENGTH);

        if (!is_valid_username(username)) {
            show_message('Please enter a valid username.', 'danger');
            return null;
        }

        if (!is_valid_password(password)) {
            show_message('Please enter a password.', 'danger');
            return null;
        }

        return {
            username: username,
            password: password
        };
    }

    /**
     * Performs the authentication request
     */
    function authenticate() {
        if (is_submitting) {
            return false;
        }

        const credentials = validate_credentials();

        if (!credentials) {
            return false;
        }

        // Cancel any in-flight request
        if (abort_controller) {
            abort_controller.abort();
        }

        abort_controller = new AbortController();

        const timeout_id = setTimeout(function () {
            if (abort_controller) {
                abort_controller.abort();
            }
        }, REQUEST_TIMEOUT_MS);

        is_submitting = true;
        set_loading(true);
        show_message('Authenticating...', 'info');

        fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials),
            mode: 'cors',
            signal: abort_controller.signal,
            credentials: 'same-origin'
        })
            .then(function (response) {
                clearTimeout(timeout_id);

                if (response.status === 200) {
                    return response.json();
                }

                if (response.status === 401) {
                    throw new Error('Invalid username or password.');
                }

                if (response.status === 429) {
                    throw new Error('Too many login attempts. Please try again later.');
                }

                throw new Error('Authentication failed. Please try again.');
            })
            .then(function (json) {
                if (!json || typeof json !== 'object') {
                    throw new Error('Invalid server response.');
                }

                // Store user data
                try {
                    window.localStorage.setItem('user', JSON.stringify(json));
                } catch (e) {
                    throw new Error('Unable to save session. Please enable cookies.');
                }

                // Hide form and clear fields
                hide_card();
                clear_form();
                show_message('Login successful! Redirecting...', 'success');

                // Redirect to dashboard
                setTimeout(function () {
                    window.location.href = '/dashboard';
                }, REDIRECT_DELAY_MS);
            })
            .catch(function (error) {
                clearTimeout(timeout_id);

                is_submitting = false;
                set_loading(false);

                if (error.name === 'AbortError') {
                    show_message('Request timed out. Please try again.', 'danger');
                    return;
                }

                show_message(error.message || 'Authentication failed.', 'danger');
            });

        return false;
    }

    /**
     * Handles form submission via Enter key
     * @param {KeyboardEvent} event - Keyboard event
     */
    function handle_keypress(event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
            event.preventDefault();
            authenticate();
        }
    }

    /* ------------------------------------------------------------------
     * Public API
     * ------------------------------------------------------------------ */
    const api = {

        /**
         * Initializes the login module
         */
        init: function () {
            // Ensure DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function () {
                    api.init();
                });
                return;
            }

            // Clear any existing session
            try {
                window.localStorage.removeItem('user');
            } catch (e) {
                // Storage may be unavailable
            }

            const elements = get_dom();

            // Bind click event to login button
            if (elements.login_button) {
                elements.login_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    authenticate();
                });
            }

            // Bind Enter key on form fields
            if (elements.username) {
                elements.username.addEventListener('keypress', handle_keypress);
            }

            if (elements.password) {
                elements.password.addEventListener('keypress', handle_keypress);
            }

            // Focus username field
            if (elements.username) {
                elements.username.focus();
            }
        }
    };

    return api;

}());

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        loginModule.init();
    });
} else {
    loginModule.init();
}
