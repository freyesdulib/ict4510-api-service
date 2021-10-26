'use strict';

const AUTH = require('../auth/controller'),
    FIELDS = require('../libs/validate');

module.exports = function (app) {

    app.route('/api/login')
        .post(FIELDS.validate_auth, AUTH.authenticate);
};