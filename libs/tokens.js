'use strict';

var jwt = require('jsonwebtoken'),
    config = require('../config/config');

exports.create = function (username) {

    let tokenData = {
        sub: username,
        iss: config.tokenIssuer
    };

    let token = jwt.sign(tokenData, config.secretKey, {
        algorithm: config.tokenAlgo,
        expiresIn: config.tokenExpire
    });

    return token;
};

exports.verify = function (req, res, next) {

    let token = req.headers['x-access-token'] || req.query.token;

    if (token) {

        jwt.verify(token, config.secretKey, function (error, decoded) {

            if (error) {
                res.status(401).send({
                    message: 'Unauthorized request ' + error
                });

                return false;
            }

            req.decoded = decoded;
            next();
        });

    } else {

        res.status(401).send({
            message: 'Unauthorized request'
        });
    }
};