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
 * config module returns api url
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

        if (window.location.hostname === 'ict-4510-api-service-nq86b.ondigitalocean.app') {
            url = 'https://ict-4510-api-service-nq86b.ondigitalocean.app/';
        } else if(window.location.hostname === 'localhost') {
            url = 'http://localhost:3000/';
        }

        console.log(window.location.hostname);

        return url;
    };

    obj.init = function () {};
    return obj;

}());