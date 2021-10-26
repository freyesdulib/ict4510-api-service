'use strict';

const BCRYPT = require('bcrypt');

exports.encrypt = function (val) {
    const salt = genSalt();
    return hash(val, salt);
};

exports.verify = function (val, hash) {
    return BCRYPT.compareSync(val, hash)
};

const genSalt = function () {
    const SALT_WORK_FACTOR = 10;
    return BCRYPT.genSaltSync(SALT_WORK_FACTOR);
};

const hash = function (val, salt) {
    return BCRYPT.hashSync(val, salt);
};