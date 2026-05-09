/**
 * Copyright 2021 fernando.reyes@du.edu
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const AUTH = require('../auth/model');
const LOGGER = require('../libs/log4');

/**
 * Sends standardized response to client
 * @param {Object} res - Express response object
 * @param {Object} result - Result object with status and data
 */
function send_response(res, result) {
    if (result.data === null || result.data === undefined) {
        res.status(result.status).end();
    } else {
        res.status(result.status).send(result.data);
    }
}

/**
 * Handles unexpected controller errors
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} operation - Operation name for logging
 */
function handle_controller_error(res, error, operation) {
    LOGGER.module().error('Controller error in ' + operation + ': ' + error.message);

    res.status(500).send({
        message: 'Internal server error'
    });
}

/**
 * Authenticates user with credentials
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.authenticate = async function (req, res) {
    try {
        const result = await AUTH.authenticate(req);
        send_response(res, result);
    } catch (error) {
        handle_controller_error(res, error, 'authenticate');
    }
};