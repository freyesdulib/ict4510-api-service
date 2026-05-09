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
 * Contact page module - refactored for security, efficiency, and reliability
 */

'use strict';

const contactModule = (function () {

    /* ------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------ */
    const MAP_CONFIG = Object.freeze({
        lat: 39.678380,
        long: -104.961753,
        zoom: 13,
        max_zoom: 18,
        tile_size: 512,
        zoom_offset: -1,
        popup_text: 'University of Denver | ICT4510'
    });

    const MAPBOX_CONFIG = Object.freeze({
        tile_url: 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
        style_id: 'mapbox/streets-v11',
        access_token: 'your-access-token',
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
    });

    const MESSAGE_DISPLAY_MS = 5000;
    const NAME_MAX_LENGTH = 100;

    /* ------------------------------------------------------------------
     * State
     * ------------------------------------------------------------------ */
    let map_instance = null;

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
            contact_name: document.querySelector('#contact_name'),
            contact_form: document.querySelector('.tm-contact-form'),
            send_button: document.querySelector('#send-message-button'),
            map_container: document.querySelector('#map')
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
        if (typeof value !== 'string') {
            return '';
        }

        return value.trim().slice(0, max_length);
    }

    /* ------------------------------------------------------------------
     * Message display
     * ------------------------------------------------------------------ */

    /**
     * Displays a message to the user using safe DOM methods
     * @param {string} text - Message text
     * @param {boolean} is_html - Whether text contains safe HTML
     */
    function show_message(text, is_html) {
        const elements = get_dom();

        if (!elements.message) {
            return;
        }

        // Clear existing content
        while (elements.message.firstChild) {
            elements.message.removeChild(elements.message.firstChild);
        }

        if (is_html) {
            const strong = document.createElement('strong');
            strong.textContent = text;
            elements.message.appendChild(strong);
        } else {
            elements.message.textContent = text;
        }
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
     * Map functionality
     * ------------------------------------------------------------------ */

    /**
     * Initializes the Leaflet map
     */
    function init_map() {
        const elements = get_dom();

        if (!elements.map_container) {
            return;
        }

        // Check if Leaflet is available
        if (typeof L === 'undefined') {
            console.error('Leaflet library not loaded');
            return;
        }

        // Prevent re-initialization
        if (map_instance !== null) {
            return;
        }

        try {
            map_instance = L.map('map').setView(
                [MAP_CONFIG.lat, MAP_CONFIG.long],
                MAP_CONFIG.zoom
            );

            L.tileLayer(MAPBOX_CONFIG.tile_url, {
                attribution: MAPBOX_CONFIG.attribution,
                maxZoom: MAP_CONFIG.max_zoom,
                id: MAPBOX_CONFIG.style_id,
                tileSize: MAP_CONFIG.tile_size,
                zoomOffset: MAP_CONFIG.zoom_offset,
                accessToken: MAPBOX_CONFIG.access_token
            }).addTo(map_instance);

            L.marker([MAP_CONFIG.lat, MAP_CONFIG.long])
                .addTo(map_instance)
                .bindPopup(MAP_CONFIG.popup_text);

        } catch (error) {
            console.error('Failed to initialize map:', error.message);
        }
    }

    /* ------------------------------------------------------------------
     * Form handling
     * ------------------------------------------------------------------ */

    /**
     * Processes the contact form submission
     */
    function process_contact_form() {
        const elements = get_dom();

        if (!elements.contact_name) {
            return;
        }

        const name = sanitize_input(elements.contact_name.value, NAME_MAX_LENGTH);

        if (!name) {
            show_message('Please enter your name.', false);
            return;
        }

        // Display thank you message with escaped name
        show_message('Thank you, ' + escape_html(name) + '!', true);

        // Reset form after delay
        setTimeout(function () {
            if (elements.contact_form) {
                elements.contact_form.reset();
            }
            clear_message();
        }, MESSAGE_DISPLAY_MS);
    }

    /* ------------------------------------------------------------------
     * Public API
     * ------------------------------------------------------------------ */
    const api = {

        /**
         * Initializes the contact module
         */
        init: function () {
            // Ensure DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function () {
                    api.init();
                });
                return;
            }

            const elements = get_dom();

            // Bind click event to send button
            if (elements.send_button) {
                elements.send_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    process_contact_form();
                });
            }

            // Initialize map
            init_map();
        }
    };

    return api;

}());

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        contactModule.init();
    });
} else {
    contactModule.init();
}
