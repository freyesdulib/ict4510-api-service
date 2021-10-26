/**
 * fernando.reyes@du.edu
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
            let image = Math.floor(Math.random() * (images.length + 1));
            html += `<div class="tm-product">
            <img src="website-assets/img/menu-${image}.jpg" alt="Product">
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