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