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

const BCRYPT = require('bcrypt');

exports.encrypt = function (val) {
    const salt = genSalt();
    return hash(val, salt);
};

exports.verify = function (val, hash) {
    return BCRYPT.compareSync(val, hash)
};

const genSalt = function () {
    const SALT_WORK_FACTOR = 10;
    return BCRYPT.genSaltSync(SALT_WORK_FACTOR);
};

const hash = function (val, salt) {
    return BCRYPT.hashSync(val, salt);
};