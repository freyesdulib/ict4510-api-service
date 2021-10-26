'use strict';

const USERS = require('../users/model');

exports.save = function (req, res) {
    USERS.save(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.read = function (req, res) {
    USERS.read(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.update = function (req, res) {
    USERS.update(req, function (data) {
        res.status(data.status).send(data.data);
    });
};