'use strict';

const MENUS = require('../menus/model');

exports.save = function (req, res) {
    MENUS.save(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.read = function (req, res) {
    MENUS.read(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.update = function (req, res) {
    MENUS.update(req, function (data) {
        res.status(data.status).send(data.data);
    });
};

exports.delete = function (req, res) {
    MENUS.delete(req, function (data) {
        res.status(data.status).send(data.data);
    });
};