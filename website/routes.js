'use strict';

const WEBSITE = require('.//controller');

module.exports = function (app) {

    app.route('/')
        .get(WEBSITE.get_home_page);

    app.route('/menu')
        .get(WEBSITE.get_menu_page);

    app.route('/contact')
        .get(WEBSITE.get_contact_page);

    app.route('/login')
        .get(WEBSITE.get_login_page);

    app.route('/dashboard')
        .get(WEBSITE.get_dashboard_page);
};