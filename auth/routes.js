'use strict';

const Auth = require('../auth/controller'),
    fields = require('../libs/validate');

module.exports = function (app) {

    app.route('/api/login')
        .post(fields.validate_auth, Auth.authenticate);
};