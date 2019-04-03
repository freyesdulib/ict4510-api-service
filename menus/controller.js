'use strict';

const Menus = require('../menus/model');

exports.save = function (req, res) {
    Menus.save(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.read = function (req, res) {
    Menus.read(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.update = function (req, res) {
    Menus.update(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.delete = function (req, res) {
    Menus.delete(req, function (data) {
        res.status(data.status).send(data.data);
    });
};