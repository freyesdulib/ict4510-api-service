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
 * Home page module
 */

'use strict';

const homeModule = (function () {

    const API_KEY = configModule.get_api_key();
    const URL = configModule.get_api_url() + 'api/menus?api_key=' + API_KEY;
    let obj = {};

    /**
     * Gets menu items
     */
    const get_menu_items = function () {

        fetch(URL)
            .then(function (response) {

                if (response.status === 200) {
                    return response.json();
                }

            })
            .then(function (json) {
                display_menu_items(json.menu);
            });
    };

    /**
     * Renders repository stats on home page
     * @param menu
     */
    const display_menu_items = function (menu) {

        if (menu.length === 0) {
            document.querySelector('#menu').innerHTML = '<div class="alert alert-info"><small>Sorry!, no daily menu today.</small></div>';
            return false;
        }

        let html = '';

        for (let i = 0;i<menu.length;i++) {
            html += `<li>${menu[i].item}</li>`;
        }

        document.querySelector('#menu').innerHTML = html;
    };

    obj.init = function () {
        get_menu_items();
    };

    return obj;

}());

// init function calls get_menu_items() function when the page loads
homeModule.init();