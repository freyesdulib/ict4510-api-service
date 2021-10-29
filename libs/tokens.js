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
const VALIDATOR = require("validator");

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
    token = 'eyJzdWIiOiJmcmV5ZXMiLCJpc3MiOiJpY3Q0NTEwLmR1LmVkdSIsImlhdCI6MTYzNTUzMzE3MywiZXhwIjoxNjM1NTYxOTczfQ.PC0dLRkB-vfiIDyl1ciDPaZ-UvNZcxZ7pO0m8laqfKqRDz_lnfug8qziiL7sNzu4kEWgt3dghlUIwBj2VYVNzg';
    if (token !== undefined && VALIDATOR.isJWT(token)) {

        JWT.verify(token, CONFIG.secretKey, function (error, decoded) {

            if (error) {

                res.status(401).send({
                    message: 'Unauthorized request ' + error
                });

                return false;
            }

            req.decoded = decoded;
            next();
        });

    } else if (key !== undefined)  {

            let api_key = key;

            if (Array.isArray(key)) {
                api_key = key.pop();
            }

            if (!VALIDATOR.isAlphanumeric(api_key)) {
                res.status(401).send({
                    message: 'Unauthorized request'
                });

                return false;
            }

            req.query.api_key = api_key;

        next();

    } else {
        res.status(401).send({
            message: 'Unauthorized request'
        });
    }
};
