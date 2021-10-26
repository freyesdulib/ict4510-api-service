'use strict';

const PING = require('../ping/controller');

module.exports = function (app) {

    app.route('/api/ping')
        .get(PING.get);

};