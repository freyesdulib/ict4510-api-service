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

const DB = require('../config/db')(),
    BCRYPT = require('../libs/bcrypt'),
    TOKENS = require('../libs/tokens'),
    KEYGEN = require('hat');

/**
 * Saves user data to Database
 * @param req
 * @param callback
 */
exports.save = function (req, callback) {

    if (req.body === undefined) {
        callback({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    let User = req.body;
    User.password = BCRYPT.encrypt(User.password);
    User.api_key = KEYGEN();
    User.username = User.username.toLowerCase();

    DB('users')
        .insert(User)
        .then(function (data) {
            callback({
                status: 201,
                data: {
                    message: 'User saved'
                }
            });
        })
        .catch(function (error) {
            console.error('ERROR: unable to save user', error); // Log the error
            callback({
                status: 500, // Internal Server Error
                data: {
                    message: 'Error saving user'
                }
            });
        });
};

/**
 * Gets user by its API KEY
 * @param req
 * @param callback
 */
exports.read = function (req, callback) {

    let api_key = req.query.api_key;

    if (Array.isArray(api_key)) {
        api_key = api_key.pop();
    }

    DB('users')
        .where({
            api_key: api_key
        })
        .select('id', 'username', 'first_name', 'last_name')
        .then(function (data) {

            callback({
                status: 200,
                data: {
                    user: data[0]
                }
            });
        })
        .catch(function (error) {
            throw 'ERROR: unable to get user ' + error;
        });
};

/**
 * Updates user data by its id and API KEY
 * @param req
 * @param callback
 */
exports.update = function (req, callback) {

    if (req.body === undefined) {
        callback({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    let api_key = req.query.api_key,
        User = req.body;

    if (Array.isArray(api_key)) {
        api_key = api_key.pop();
    }

    let id = User.id;
    delete User.id;

    DB('users')
        .where({
            api_key: api_key,
            id: id
        })
        .update(User)
        .then(function (data) {
            callback({
                status: 204
            });
        })
        .catch(function (error) {
            throw 'ERROR: unable to update record ' + error;
        });

};

/**
 * Authenticates user
 * @param req
 * @param callback
 * @returns {boolean}
 */
exports.authenticate = function (req, callback) {

    if (req.body === undefined) {
        callback({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    let User = req.body;

    DB('users')
        .where({
            username: User.username
        })
        .select('username', 'password', 'first_name', 'last_name', 'api_key')
        .then(function (data) {

            if (data.length === 0) {

                callback({
                    status: 401,
                    data: {
                        message: 'User not found.'
                    }
                });

                return false;
            }

            let user = data[0],
                isAuth = BCRYPT.verify(User.password, user.password);

            if (isAuth) {

                delete user.password;
                user.token = TOKENS.create(user.username);

                callback({
                    status: 200,
                    data: {
                        user: user
                    }
                });

            } else {

                callback({
                    status: 401,
                    data: {
                        message: 'Authentication failed'
                    }
                });
            }

        })
        .catch(function (error) {
            throw 'ERROR: unable to get user ' + error;
        });
};