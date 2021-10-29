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

const Ajv = require('ajv');
const ajv = new Ajv();

const VALIDATE_JSON = function (data, properties, required_properties) {

    let errors = [];
    let schema = {
        type: 'object',
        properties: properties,
        required: required_properties,
        additionalProperties: false
    };

    const VALIDATE_SCHEMA = ajv.compile(schema);
    const IS_VALID = VALIDATE_SCHEMA(data);

    if (!IS_VALID) {
        errors.push(VALIDATE_SCHEMA.errors);
    }

    return errors;
};

/**
 * Validates auth input fields
 * @param req
 * @param res
 * @param next
 */
exports.validate_auth = function (req, res, next) {

    let errors = [];

    if (req.body === undefined) {
        errors.push({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    let properties = {
        username: {type: 'string'},
        password: {type: 'string'}
    };

    let required_properties = ['username', 'password'];
    errors.push(VALIDATE_JSON(req.body, properties, required_properties));

    if (req.body.username === undefined) {
        errors.push({
            field: 'username',
            message: 'username field is missing.'
        });
    } else if (req.body.username.length === 0 && req.body.username.length < 4) {
        errors.push({
            field: 'username',
            message: 'Username is required'
        });
    }

    if (req.body.password === undefined) {
        errors.push({
            field: 'password',
            message: 'password field is missing.'
        });
    } else if (req.body.password.length === 0 || req.body.password.length < 5) {
        errors.push({
            field: 'password',
            message: 'Password required.'
        });
    }

    if (errors.length === 0) {
        next();
    } else {
        res.status(401).json({
            errors: errors
        });
    }
};

/**
 * Validates user input fields
 * @param req
 * @param res
 * @param next
 */
exports.validate_user = function (req, res, next) {

    let errors = [];

    if (req.body === undefined) {
        errors.push({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    let properties = {
        first_name: {type: 'string'},
        last_name: {type: 'string'},
        username: {type: 'string'},
        password: {type: 'string'}
    };

    let required_properties = ['first_name', 'last_name', 'username', 'password'];
    errors.push(VALIDATE_JSON(req.body, properties, required_properties));

    if (req.body.username === undefined) {
        errors.push({
            field: 'username',
            message: 'username field is missing.'
        });
    } else if (req.body.username.length === 0 && req.body.username.length < 4) {
        errors.push({
            field: 'username',
            message: 'Username is required'
        });
    }

    if (req.body.first_name === undefined) {
        errors.push('first_name field is missing.');
    } else if (req.body.first_name.length === 0 && req.body.first_name.length < 3) {
        errors.push({
            field: 'first_name',
            message: 'First name required.'
        });
    }

    if (req.body.last_name === undefined) {
        errors.push({
            field: 'last_name',
            message: 'last_name field is missing.'
        });
    } else if (req.body.last_name.length === 0 && req.body.last_name.length < 3) {
        errors.push({
            field: 'last_name',
            message: 'Last name required.'
        });
    }

    if (req.body.password === undefined) {
        errors.push({
            field: 'password',
            message: 'password field is missing.'
        });
    } else if (req.body.password.length === 0 || req.body.password.length < 5) {
        errors.push({
            field: 'password',
            message: 'Password required and must be at least 5 characters long.'
        });
    }

    if (errors.length === 0) {
        next();
    } else {
        res.status(400).json({
            errors: errors
        });
    }
};

/**
 * Validates menu item input fields
 * @param req
 * @param res
 * @param next
 */
exports.validate_menu_item = function (req, res, next) {

    let errors = [];

    if (req.body === undefined) {
        errors.push({
            status: 400,
            data: {
                message: 'Bad Request'
            }
        });
    }

    let properties = {
        item: {type: 'string'},
        description: {type: 'string'},
        price: {type: 'string'}
    };

    let required_properties = ['item', 'description', 'price'];
    errors.push(VALIDATE_JSON(req.body, properties, required_properties));

    if (req.body.item === undefined) {
        errors.push({
            field: 'item',
            message: 'item field is missing.'
        });
    } else if (req.body.item.length === 0 && req.body.item.length < 4) {
        errors.push({
            field: 'item',
            message: 'Item is required'
        });
    }

    if (req.body.description === undefined) {
        errors.push('description field is missing.');
    } else if (req.body.description.length === 0 && req.body.description.length < 3) {
        errors.push({
            field: 'description',
            message: 'Description is required.'
        });
    }

    if (req.body.price === undefined) {
        errors.push({
            field: 'price',
            message: 'price field is missing.'
        });
    } else if (req.body.price.length === 0 && req.body.price.length < 3) {
        errors.push({
            field: 'price',
            message: 'Price is required.'
        });
    }

    if (errors.length === 0) {
        next();
    } else {
        res.status(400).json({
            errors: errors
        });
    }
};