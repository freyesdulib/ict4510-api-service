'use strict';

const Users = require('../users/model');

exports.authenticate = function (req, res) {
    Users.authenticate(req, function (data) {
        res.status(data.status).send(data.data);
    });
};