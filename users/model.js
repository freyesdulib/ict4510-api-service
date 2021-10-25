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

    let User = req.body;
    User.password = BCRYPT.encrypt(User.password);
    User.api_key = KEYGEN();

    DB('users')
        .insert(User)
        .then(function (data) {
            console.log(data);
        })
        .catch(function (error) {
            throw 'ERROR: unable to save user ' + error;
        });

    callback({
        status: 201,
        data: {
            message: 'User saved'
        }
    });
};

/**
 * Gets user by its API KEY
 * @param req
 * @param callback
 */
exports.read = function (req, callback) {

    let api_key = req.query.api_key;

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
 * Updates user data by its API KEY
 * @param req
 * @param callback
 */
exports.update = function (req, callback) {

    let api_key = req.query.api_key,
        User = req.body;

    if (User === undefined) {
        callback({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
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

    let User = req.body;

    if (User === undefined) {
        callback({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    if (User.username.length === 0 || User.password.length === 0) {
        callback({
            status: 401,
            data: {
                message: 'Authentication failed'
            }
        });
        return false;
    }

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