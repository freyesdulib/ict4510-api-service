'use strict';

const CREATEDOMPURIFY = require('dompurify'),
    {JSDOM} = require('jsdom'),
    WINDOW = new JSDOM('').window,
    DOMPURIFY = CREATEDOMPURIFY(WINDOW);

/**
 * Middleware function used to sanitize body (form) inputs
 * @param req
 * @param res
 * @param next
 */
exports.sanitize_req_body = function(req, res, next) {

    if (req.body === undefined) {
        next();
    }

    let keys = Object.keys(req.body);

    keys.map(function (prop) {

        if (req.body.hasOwnProperty(prop)) {

            if (prop !== 'is_active' && typeof req.body[prop] === 'string') {
                req.body[prop] = DOMPURIFY.sanitize(req.body[prop]);
            }
        }
    });

    next();
};

/**
 * Middleware function used to sanitize query string inputs
 * @param req
 * @param res
 * @param next
 */
exports.sanitize_req_query = function(req, res, next) {

    if (req.query === undefined) {
        next();
    }

    let keys = Object.keys(req.query);

    keys.map(function (prop) {

        if (req.query.hasOwnProperty(prop) && typeof req.query[prop] === 'string') {
            req.query[prop] = DOMPURIFY.sanitize(req.query[prop]);
        }
    });

    next();
};