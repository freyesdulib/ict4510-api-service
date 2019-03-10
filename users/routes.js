'use strict';

const Users = require('../users/controller'),
    token = require('../libs/tokens');

module.exports = function (app) {

    app.route('/api/users')
        .post(Users.save);

    app.route('/api/users')
        .get(token.verify, Users.get);

};