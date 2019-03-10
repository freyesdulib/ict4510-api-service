'use strict';

const config = require('../config/config.js'),
    bcrypt = require('../libs/bcrypt'),
    tokens = require('../libs/tokens'),
    hat = require('hat'),
    knex = require('knex')({
        client: 'mysql2',
        connection: {
            host: config.dbHost,
            user: config.dbUser,
            password: config.dbPassword,
            database: config.dbName
        }
    });

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
    User.password = bcrypt.encrypt(User.password);
    User.api_key = hat();

    knex('users')
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

// http://localhost:4510/api/users?api_key=1c3c12413e929078b3c48a9e0367eac1
exports.get = function (req, callback) {

    let api_key = req.query.api_key;

    if (api_key === undefined || api_key.length === 0) {
        callback({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    knex('users')
        .where({
            api_key: api_key
        })
        .select('username', 'first_name', 'last_name')
        .then(function (data) {

            let user = data[0];

            callback({
                status: 200,
                data: {
                    user: user
                }
            });
        })
        .catch(function (error) {
            throw 'ERROR: unable to get user ' + error;
        });
};

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

    knex('users')
        .where({
            username: User.username
        })
        .select('username', 'password', 'first_name', 'last_name', 'api_key')
        .then(function (data) {

            let user = data[0],
                isAuth = bcrypt.verify(User.password, user.password);

            if (isAuth) {

                delete user.password;
                user.token = tokens.create(user.username);

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