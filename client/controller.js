'use strict';

exports.get_home_page = function (req, res) {
    res.render('home');
};

exports.get_menu_page = function (req, res) {
    res.render('menu');
};

exports.get_contact_page = function (req, res) {
    res.render('contact');
};

exports.get_login_page = function (req, res) {
    res.render('login');
};

exports.get_dashboard_page = function (req, res) {
    res.render('dashboard');
};