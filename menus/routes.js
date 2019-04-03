'use strict';

const Menus = require('../menus/controller'),
    token = require('../libs/tokens');

module.exports = function (app) {

    app.route('/api/menus')
        .post(token.verify, Menus.save)
        .get(Menus.read)
        .put(token.verify, Menus.update)
        .delete(token.verify, Menus.delete);
};