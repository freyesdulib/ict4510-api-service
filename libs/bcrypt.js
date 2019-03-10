'use strict';

const bcrypt = require('bcrypt');

exports.encrypt = function (val) {
    const salt = genSalt();
    return hash(val, salt);
};

exports.verify = function (val, hash) {
    return bcrypt.compareSync(val, hash)
};

const genSalt = function () {
    const SALT_WORK_FACTOR = 10;
    return bcrypt.genSaltSync(SALT_WORK_FACTOR);
};

const hash = function (val, salt) {
    return bcrypt.hashSync(val, salt);
};