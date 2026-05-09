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
 * Config module - returns API URL based on environment
 */

'use strict';

const configModule = (function () {

    const ENVIRONMENTS = Object.freeze({
        production: 'https://ict4510.herokuapp.com/',
        digitalocean: 'https://ict-4510-api-service-nq86b.ondigitalocean.app/',
        localhost: 'http://localhost:3000/'
    });

    const HOSTNAME_MAP = Object.freeze({
        'ict-4510-api-service-nq86b.ondigitalocean.app': 'digitalocean',
        'localhost': 'localhost',
        '127.0.0.1': 'localhost'
    });

    const DEFAULT_TIMEOUT_MS = 10000;

    const api = Object.freeze({

        /**
         * Returns API URL based on current hostname
         * @returns {string} The API base URL
         */
        get_api_url: function () {
            const hostname = window.location.hostname || '';
            const environment = HOSTNAME_MAP[hostname] || 'production';
            return ENVIRONMENTS[environment];
        },

        /**
         * Returns the default request timeout in milliseconds
         * @returns {number} Timeout value
         */
        get_timeout: function () {
            return DEFAULT_TIMEOUT_MS;
        },

        /**
         * Validates that a URL belongs to allowed API origins
         * @param {string} url - URL to validate
         * @returns {boolean} True if URL is from allowed origin
         */
        is_valid_api_url: function (url) {
            if (typeof url !== 'string' || !url) {
                return false;
            }

            try {
                const parsed_url = new URL(url);
                const allowed_origins = Object.values(ENVIRONMENTS).map(function (env_url) {
                    return new URL(env_url).origin;
                });
                return allowed_origins.indexOf(parsed_url.origin) !== -1;
            } catch (e) {
                return false;
            }
        },

        /**
         * Initialization hook
         */
        init: function () {}
    });

    return api;

}());
