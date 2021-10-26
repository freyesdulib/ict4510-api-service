'use strict';

const USERS = require('../users/model');

exports.authenticate = function (req, res) {
    USERS.authenticate(req, function (data) {
        res.status(data.status).send(data.data);
    });
};