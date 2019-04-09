'use strict';

const config = require('../config/config.js'),
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

    knex('menus')
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

    if (api_key === undefined || api_key.length === 0) {
        callback({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    knex('menus')
        .where({
            api_key: api_key
        })
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

    let api_key = req.query.api_key,
        Menu = req.body;

    if (Menu.id === undefined || api_key === undefined) {
        callback({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    let id = Menu.id;
    delete Menu.id;

    knex('menus')
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

    let api_key = req.query.api_key,
        id = req.query.id;

    if (id === undefined || api_key === undefined) {
        callback({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    knex('menus')
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