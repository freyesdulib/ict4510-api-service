'use strict';

const CONFIG = require('../config/config'),
    DB = require('knex')({
        client: 'mysql2',
        connection: {
            host: CONFIG.dbHost,
            user: CONFIG.dbUser,
            password: CONFIG.dbPassword,
            database: CONFIG.dbName
        }
    });

module.exports = function () {
    return DB;
};