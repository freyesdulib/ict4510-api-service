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

const DB = require('../config/db')();

/**
 * Saves menu item to database
 * @param req
 * @param callback
 */
exports.save = function (req, callback) {

    let Menu = req.body;
    Menu.api_key = req.query.api_key;

    if (Menu === undefined || Menu.api_key.length === 0) {
        callback({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    DB('menus')
        .insert(Menu)
        .then(function (data) {
            console.log(data);
        })
        .catch(function (error) {
            throw 'ERROR: unable to save menu ' + error;
        });

    callback({
        status: 201,
        data: {
            message: 'Menu saved'
        }
    });
};

exports.read = function (req, callback) {

    let api_key = req.query.api_key;
    let id = req.query.id;
    let whereObj = {};

    if (Array.isArray(id)) {
        id = id.pop();
    }

    whereObj.api_key = api_key;

    if (id !== undefined) {
        whereObj.id = id;
    }

    DB('menus')
        .where(whereObj)
        .select('id', 'item', 'description', 'price')
        .then(function (data) {

            callback({
                status: 200,
                data: {
                    menu: data
                }
            });
        })
        .catch(function (error) {
            throw 'ERROR: unable to get menu ' + error;
        });
};

exports.update = function (req, callback) {

    let api_key = req.query.api_key;
    let Menu = req.body;

    if (Menu.id === undefined) {
        callback({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    let id = Menu.id;
    delete Menu.id;

    DB('menus')
        .where({
            api_key: api_key,
            id: id
        })
        .update(Menu)
        .then(function (data) {
            callback({
                status: 204
            });
        })
        .catch(function (error) {
            throw 'ERROR: unable to update record ' + error;
        });

};

exports.delete = function (req, callback) {

    let api_key = req.query.api_key;
    let id = req.query.id;

    if (id === undefined) {
        callback({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    DB('menus')
        .where({
            api_key: api_key,
            id: id
        })
        .del()
        .then(function () {

            callback({
                status: 204
            });
        })
        .catch(function (error) {
            throw error;
        });
};