/**
 Copyright 2021 fernando.reyes@du.edu

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

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