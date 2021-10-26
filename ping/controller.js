'use strict';

const PING = require('../ping/model');

exports.get = function (req, res) {
    PING.get(req, function (data) {
        res.status(data.status).send(data.data);
    });
};