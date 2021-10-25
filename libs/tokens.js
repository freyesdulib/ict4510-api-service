'use strict';

const JWT = require('jsonwebtoken'),
    CONFIG = require('../config/config');

exports.create = function (username) {

    let tokenData = {
        sub: username,
        iss: CONFIG.tokenIssuer
    };

    return JWT.sign(tokenData, CONFIG.secretKey, {
        algorithm: CONFIG.tokenAlgo,
        expiresIn: CONFIG.tokenExpire
    });
};

exports.verify = function (req, res, next) {

    let token = req.headers['x-access-token'] || req.query.t;
    let key = req.query.api_key;

    if (token !== undefined) {

        JWT.verify(token, CONFIG.secretKey, function (error, decoded) {
            console.log(error);
            if (error) {

                // LOGGER.module().error('ERROR: [/libs/tokens lib (verify)] unable to verify token ' + error);

                res.status(401).send({
                    message: 'Unauthorized request ' + error
                });

                return false;
            }

            req.decoded = decoded;
            next();
        });

    } else if (key !== undefined)  {
        next();
    } else {
        res.status(401).send({
            message: 'Unauthorized request'
        });
    }
};

/*
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

 */