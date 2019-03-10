'use strict';

var Auth = require('../auth/controller');

module.exports = function (app) {

    app.route('/api/login')
        .post(Auth.authenticate);
};