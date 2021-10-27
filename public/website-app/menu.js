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
 * Menu page module
 */

'use strict';

const menuModule = (function () {

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
     * Displayes menu items
     * @param menu
     * @returns {boolean}
     */
    const display_menu_items = function (menu) {

        if (menu.length === 0) {
            document.querySelector('#menu').innerHTML = '<div class="alert alert-info"><small>Sorry!, no menu today.</small></div>';
            return false;
        }

        let images = ['menu-1.jpg', 'menu-2.jpg', 'menu-3.jpg', 'menu-4.jpg', 'menu-5.jpg'];
        let html = '';

        for (let i = 0;i<menu.length;i++) {

            let index = Math.floor(Math.random() * (images.length));

            if (index === 0) {
                index = index + 1;
            }

            html += `<div class="tm-product">
            <img src="website-assets/img/${images[index]}" alt="Product">
            <div class="tm-product-text">
            <h3 class="tm-product-title">${menu[i].item}</h3>
            <p class="tm-product-description">${menu[i].description}</p>
            </div>
            <div class="tm-product-price">
            <a href="#" class="tm-product-price-link tm-handwriting-font"><span class="tm-product-price-currency">$</span>${menu[i].price}</a>
            </div>
            </div>`;
        }

        document.querySelector('#menu').innerHTML = html;
    };

    obj.init = function () {
        get_menu_items();
    };

    return obj;

}());

// init function calls get_menu_items() function when the page loads
menuModule.init();