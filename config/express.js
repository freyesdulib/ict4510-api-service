'use strict';

const HTTP = require('http'),
    EXPRESS = require('express'),
    COMPRESS = require('compression'),
    BODYPARSER = require('body-parser'),
    METHODOVERRIDE = require('method-override'),
    HELMET = require('helmet'),
    CORS = require('cors'),
    XSS = require('../libs/dom');

module.exports = function () {

    const APP = EXPRESS(),
        SERVER = HTTP.createServer(APP);

    if (process.env.NODE_ENV === 'development') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    } else if (process.env.NODE_ENV === 'production') {
        APP.use(COMPRESS());
    }

    APP.use(BODYPARSER.urlencoded({
        extended: true
    }));

    APP.use(BODYPARSER.json());
    APP.use(METHODOVERRIDE());
    APP.use(HELMET());
    APP.use(EXPRESS.static('./public'));
    APP.use(XSS.sanitize_req_query);
    APP.use(XSS.sanitize_req_body);
    APP.set('views', './views');
    APP.set('view engine', 'ejs');
    APP.use(CORS({
        'origin': '*',
        'methods': 'GET,HEAD,PUT,PATCH,POST,OPTIONS,DELETE',
        'preflightContinue': true
    }));

    require('../website/routes')(APP);
    require('../ping/routes')(APP);
    require('../auth/routes')(APP);
    require('../menus/routes')(APP);
    require('../users/routes')(APP);

    return SERVER;
};