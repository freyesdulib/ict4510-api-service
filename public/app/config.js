/**
 * fernando.reyes@du.edu
 * ICT4510 final project example
 * config holds api url and api key
 */

'use strict';

const get_api_url = function () {

    let url ='https://ict4510.herokuapp.com/';

    if (window.location.hostname === 'localhost') {
        url = 'http://localhost:3000/';
    }

    return url;
};

const get_api_key = function () {
    // used for instructional purposes only.
    return '1c3c12413e929078b3c48a9e0367eac1';
};