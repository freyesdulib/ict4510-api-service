'use strict';

const Ping = require('../ping/controller');

module.exports = function (app) {

    app.route('/api/ping')
        .get(Ping.get);

};