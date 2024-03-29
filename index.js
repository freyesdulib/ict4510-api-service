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

if (process.env.NODE_ENV === undefined) {
    require('dotenv').load();
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const express = require('./config/express');
const app = express();

const port = process.env.PORT || 3000;
app.listen(port);

console.log('ICT4510 API service running at http://' + process.env.APP_HOST + ':' + port + ' in ' + process.env.NODE_ENV + ' mode.');

module.exports = app;