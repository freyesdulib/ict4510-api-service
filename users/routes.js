'use strict';

const Users = require('../users/controller'),
    token = require('../libs/tokens'),
    fields = require('../libs/validate');

module.exports = function (app) {

    app.route('/api/users')
        .post(fields.validate_user, Users.save)
        .put(token.verify, fields.validate_user, Users.update)
        .get(token.verify, Users.read);
};