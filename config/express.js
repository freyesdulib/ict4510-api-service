'use strict';

const http = require('http'),
    express = require('express'),
    compress = require('compression'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    helmet = require('helmet'),
    cors = require('cors'),
    config = require('../config/config');

module.exports = function () {

    const app = express(),
        server = http.createServer(app);

    if (process.env.NODE_ENV === 'development') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    } else if (process.env.NODE_ENV === 'production') {
        app.use(compress());
    }

    let cors_options = {
        'origin': '*',
        'methods': 'GET,HEAD,PUT,PATCH,POST,OPTIONS,DELETE',
        'preflightContinue': true
    };

    app.use(cors(cors_options));
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());
    app.use(methodOverride());
    app.use(helmet());

    require('../ping/routes')(app);
    require('../auth/routes')(app);
    require('../menus/routes')(app);
    require('../users/routes')(app);

    return server;
};