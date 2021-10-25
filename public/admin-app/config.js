/**
 * fernando.reyes@du.edu
 * ICT4510 final project example
 * config holds api url
 */

'use strict';

const get_api_url = function () {

    let url ='https://ict4510.herokuapp.com/';

    if (window.location.hostname === 'localhost') {
        url = 'http://localhost:3000/';
    }

    return url;
};