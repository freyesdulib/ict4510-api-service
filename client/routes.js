'use strict';

const CLIENT = require('../client/controller');

module.exports = function (app) {

    app.route('/')
        .get(CLIENT.get_home_page);

    app.route('/menu')
        .get(CLIENT.get_menu_page);

    app.route('/contact')
        .get(CLIENT.get_contact_page);

    app.route('/login')
        .get(CLIENT.get_login_page);

    app.route('/dashboard')
        .get(CLIENT.get_dashboard_page);
};