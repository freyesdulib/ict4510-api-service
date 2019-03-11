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

            let menu = data;

            callback({
                status: 200,
                data: {
                    menu: menu
                }
            });
        })
        .catch(function (error) {
            throw 'ERROR: unable to get menu ' + error;
        });
};

exports.delete = function (req, callback) {

    let id = req.query.id;

    knex('menus')
        .where('id', id)
        .del()
        .then(function () {

            callback({
                status: 204,
                data: {
                    message: 'Menu item deleted'
                }
            });
        })
        .catch(function (error) {
            throw error;
        });
};