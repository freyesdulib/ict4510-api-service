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

const MENUS = require('../menus/model');

exports.save = function (req, res) {
    MENUS.save(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.read = function (req, res) {
    MENUS.read(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.update = function (req, res) {
    MENUS.update(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.delete = function (req, res) {
    MENUS.delete(req, function (data) {
        res.status(data.status).send(data.data);
    });
};