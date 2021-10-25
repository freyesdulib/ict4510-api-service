/**
 * fernando.reyes@du.edu
 * ICT4510 final project example
 * config module holds api url and api key
 */

const configModule = (function () {

    'use strict';

    let obj = {};

    obj.get_api_url = function () {

        let url ='https://ict4510.herokuapp.com/';

        if (window.location.hostname === 'localhost') {
            url = 'http://localhost:3000/';
        }

        return url;
    };

    const set_website_title = function () {
        document.querySelectorAll('.app-site-name').innerHTML = 'ICT4510 Cafe House!';
    };

    obj.get_api_key = function () {
        // used for instructional purposes only.
        return '1c3c12413e929078b3c48a9e0367eac1';
    };

    obj.init = function () {
        // set_website_title();
    };

    return obj;
}());

// init function calls get_menu_items() function when the page loads
configModule.init();