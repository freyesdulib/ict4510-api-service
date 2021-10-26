'use strict';

exports.get_home_page = function (req, res) {
    res.render('website-home');
};

exports.get_menu_page = function (req, res) {
    res.render('website-menu');
};

exports.get_contact_page = function (req, res) {
    res.render('website-contact');
};

exports.get_login_page = function (req, res) {
    res.render('admin-login');
};

exports.get_dashboard_page = function (req, res) {
    res.render('admin-dashboard');
};