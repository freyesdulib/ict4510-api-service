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
 * Home page module - refactored for security, efficiency, and reliability
 */

'use strict';

const homeModule = (function () {

    /* ------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------ */
    const API_KEY = configModule.get_api_key();
    const MENU_ENDPOINT = configModule.get_api_url() + 'api/menus?api_key=' + encodeURIComponent(API_KEY);
    const REQUEST_TIMEOUT_MS = 10000;

    /* ------------------------------------------------------------------
     * State
     * ------------------------------------------------------------------ */
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
            menu: document.querySelector('#menu')
        };

        return dom;
    }

    /* ------------------------------------------------------------------
     * Message display
     * ------------------------------------------------------------------ */

    /**
     * Displays an info/error message in the menu container
     * @param {string} text - Message text
     * @param {string} type - Message type: 'info', 'danger', 'warning'
     */
    function show_message(text, type) {
        const elements = get_dom();

        if (!elements.menu) {
            return;
        }

        // Clear existing content
        while (elements.menu.firstChild) {
            elements.menu.removeChild(elements.menu.firstChild);
        }

        const alert_div = document.createElement('div');
        alert_div.className = 'alert alert-' + type;

        const small = document.createElement('small');
        small.textContent = text;

        alert_div.appendChild(small);
        elements.menu.appendChild(alert_div);
    }

    /* ------------------------------------------------------------------
     * Menu display
     * ------------------------------------------------------------------ */

    /**
     * Creates a list item element for a menu item
     * @param {Object} item - Menu item data
     * @returns {HTMLLIElement} List item element
     */
    function create_menu_item(item) {
        const li = document.createElement('li');
        li.textContent = item.item || '';
        return li;
    }

    /**
     * Displays menu items in the menu container
     * @param {Array} menu - Array of menu item objects
     */
    function display_menu_items(menu) {
        const elements = get_dom();

        if (!elements.menu) {
            return;
        }

        // Clear existing content
        while (elements.menu.firstChild) {
            elements.menu.removeChild(elements.menu.firstChild);
        }

        if (!Array.isArray(menu) || menu.length === 0) {
            show_message('Sorry! No daily menu today.', 'info');
            return;
        }

        // Create list and append items
        menu.forEach(function (item) {
            if (item && item.item) {
                const li = create_menu_item(item);
                elements.menu.appendChild(li);
            }
        });
    }

    /* ------------------------------------------------------------------
     * API operations
     * ------------------------------------------------------------------ */

    /**
     * Fetches menu items from the API
     */
    function get_menu_items() {
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

        fetch(MENU_ENDPOINT, {
            method: 'GET',
            signal: abort_controller.signal,
            credentials: 'same-origin'
        })
            .then(function (response) {
                clearTimeout(timeout_id);

                if (!response.ok) {
                    throw new Error('Failed to load menu');
                }

                return response.json();
            })
            .then(function (json) {
                if (json && json.menu) {
                    display_menu_items(json.menu);
                } else {
                    display_menu_items([]);
                }
            })
            .catch(function (error) {
                clearTimeout(timeout_id);

                if (error.name === 'AbortError') {
                    show_message('Request timed out. Please refresh the page.', 'warning');
                    return;
                }

                show_message('Unable to load menu. Please try again later.', 'danger');
            });
    }

    /* ------------------------------------------------------------------
     * Public API
     * ------------------------------------------------------------------ */
    const api = {

        /**
         * Initializes the home module
         */
        init: function () {
            // Ensure DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function () {
                    api.init();
                });
                return;
            }

            get_menu_items();
        }
    };

    return api;

}());

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        homeModule.init();
    });
} else {
    homeModule.init();
}
