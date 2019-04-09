'use strict';

const Menus = require('../menus/controller'),
    token = require('../libs/tokens'),
    fields = require('../libs/validate');

module.exports = function (app) {

    app.route('/api/menus')
        .post(token.verify, fields.validate, Menus.save)
        .get(Menus.read)
        .put(token.verify, fields.validate, Menus.update)
        .delete(token.verify, Menus.delete);
};