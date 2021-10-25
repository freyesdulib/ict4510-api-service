'use strict';

const Menus = require('../menus/controller'),
    token = require('../libs/tokens'),
    fields = require('../libs/validate');

module.exports = function (app) {

    app.route('/api/menus')
        .post(token.verify, fields.validate_menu_item, Menus.save)
        .get(token.verify, Menus.read)
        .put(token.verify, fields.validate_menu_item, Menus.update)
        .delete(token.verify, Menus.delete);
};