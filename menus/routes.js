'use strict';

const MENUS = require('../menus/controller'),
    TOKEN = require('../libs/tokens'),
    FIELDS = require('../libs/validate');

module.exports = function (app) {

    app.route('/api/menus')
        .post(TOKEN.verify, FIELDS.validate_menu_item, MENUS.save)
        .get(TOKEN.verify, MENUS.read)
        .put(TOKEN.verify, FIELDS.validate_menu_item, MENUS.update)
        .delete(TOKEN.verify, MENUS.delete);
};