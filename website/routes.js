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