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
 * config module holds api url and api key
 */

'use strict';

const configModule = (function () {

    let obj = {};

    /**
     * Returns api url based on current domain
     * @returns {string} url
     */
    obj.get_api_url = function () {

        let url ='https://ict4510.herokuapp.com/';

        if (window.location.hostname === 'ondigitalocean') {
            url = 'https://ict-4510-api-service-nq86b.ondigitalocean.app/';
        } else if(window.location.hostname === 'localhost') {
            url = 'http://localhost:3000/';
        }

        return url;
    };

    obj.get_api_key = function () {
        // used for instructional purposes only.
        return '1c3c12413e929078b3c48a9e0367eac1';
    };

    obj.init = function () {};
    return obj;

}());