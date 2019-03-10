'use strict';

module.exports = {
    host: process.env.HOST,
    dbHost: process.env.DB_HOST,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,
    requestOrigin: process.env.REQUEST_ORIGIN,
    secretKey: process.env.SECRET_KEY,
    tokenExpire: process.env.TOKEN_EXPIRE,
    tokenIssuer: process.env.TOKEN_ISSUER,
    tokenAlgo: process.env.TOKEN_ALGO
};