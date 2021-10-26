'use strict';

const USERS = require('../users/controller'),
    TOKEN = require('../libs/tokens'),
    FIELDS = require('../libs/validate');

module.exports = function (app) {

    app.route('/api/users')
        .post(FIELDS.validate_user, USERS.save)
        .put(TOKEN.verify, FIELDS.validate_user, USERS.update)
        .get(TOKEN.verify, USERS.read);
};