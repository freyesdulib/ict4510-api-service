/**
 * fernando.reyes@du.edu
 * ICT4510 final project example
 * Home page module
 */

'use strict';

const homeModule = (function () {

    'use strict';

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