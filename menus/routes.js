'use strict';

const Menus = require('../menus/controller'),
    token = require('../libs/tokens');

module.exports = function (app) {

    app.route('/api/menus')
        .post(token.verify, Menus.save);

    app.route('/api/menus')
        .get(Menus.read);

    app.route('/api/menus')
        .delete(token.verify, Menus.delete);

};