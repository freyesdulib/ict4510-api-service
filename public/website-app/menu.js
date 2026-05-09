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
 * Menu page module - refactored for security, efficiency, and reliability
 */

'use strict';

const menuModule = (function () {

    /* ------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------ */
    const API_KEY = configModule.get_api_key();
    const MENU_ENDPOINT = configModule.get_api_url() + 'api/menus?api_key=' + encodeURIComponent(API_KEY);
    const REQUEST_TIMEOUT_MS = 10000;

    const MENU_IMAGES = Object.freeze([
        'menu-1.jpg',
        'menu-2.jpg',
        'menu-3.jpg',
        'menu-4.jpg',
        'menu-5.jpg'
    ]);

    const IMAGE_BASE_PATH = 'website-assets/img/';

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
     * Utilities
     * ------------------------------------------------------------------ */

    /**
     * Gets a random menu image filename
     * @returns {string} Image filename
     */
    function get_random_image() {
        // Start from index 1 to skip first image (matching original behavior)
        const min_index = 1;
        const max_index = MENU_IMAGES.length - 1;
        const random_index = Math.floor(Math.random() * (max_index - min_index + 1)) + min_index;
        return MENU_IMAGES[random_index];
    }

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
     * Creates a product card element for a menu item
     * @param {Object} item - Menu item data
     * @returns {HTMLDivElement} Product card element
     */
    function create_product_card(item) {
        // Main container
        const product_div = document.createElement('div');
        product_div.className = 'tm-product';

        // Image
        const img = document.createElement('img');
        img.src = IMAGE_BASE_PATH + get_random_image();
        img.alt = 'Product';

        // Text container
        const text_div = document.createElement('div');
        text_div.className = 'tm-product-text';

        // Title
        const title = document.createElement('h3');
        title.className = 'tm-product-title';
        title.textContent = item.item || '';

        // Description
        const description = document.createElement('p');
        description.className = 'tm-product-description';
        description.textContent = item.description || '';

        text_div.appendChild(title);
        text_div.appendChild(description);

        // Price container
        const price_div = document.createElement('div');
        price_div.className = 'tm-product-price';

        // Price link
        const price_link = document.createElement('a');
        price_link.href = '#';
        price_link.className = 'tm-product-price-link tm-handwriting-font';

        // Currency span
        const currency_span = document.createElement('span');
        currency_span.className = 'tm-product-price-currency';
        currency_span.textContent = '$';

        price_link.appendChild(currency_span);
        price_link.appendChild(document.createTextNode(item.price || '0'));

        // Prevent default link behavior
        price_link.addEventListener('click', function (e) {
            e.preventDefault();
        });

        price_div.appendChild(price_link);

        // Assemble product card
        product_div.appendChild(img);
        product_div.appendChild(text_div);
        product_div.appendChild(price_div);

        return product_div;
    }

    /**
     * Displays menu items in the menu container
     * @param {Array} menu - Array of menu item objects
     */
    function display_menu_items(menu) {
        const elements = get_dom();
        console.log(menu);
        if (!elements.menu) {
            return;
        }

        // Clear existing content
        while (elements.menu.firstChild) {
            elements.menu.removeChild(elements.menu.firstChild);
        }

        if (!Array.isArray(menu) || menu.length === 0) {
            show_message('Sorry! No menu today.', 'info');
            return;
        }

        // Create and append product cards
        menu.forEach(function (item) {
            if (item && item.item) {
                const card = create_product_card(item);
                elements.menu.appendChild(card);
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
                console.log(json);
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
         * Initializes the menu module
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
        menuModule.init();
    });
} else {
    menuModule.init();
}
