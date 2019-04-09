'use strict';

const Users = require('../users/model');

exports.save = function (req, res) {
    Users.save(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.read = function (req, res) {
    Users.read(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.update = function (req, res) {
    Users.update(req, function (data) {
        res.status(data.status).send(data.data);
    });
};