'use strict';

const Users = require('../users/controller'),
    token = require('../libs/tokens');

module.exports = function (app) {

    app.route('/api/users')
        .post(Users.save)
        .put(token.verify, Users.update)
        .get(token.verify, Users.get);
};