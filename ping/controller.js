'use strict';

const Ping = require('../ping/model');

exports.get = function (req, res) {
    Ping.get(req, function (data) {
        res.status(data.status).send(data.data);
    });
};