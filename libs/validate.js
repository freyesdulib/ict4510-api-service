'use strict';

exports.validate = function (req, res, next) {

    let Input = req.body,
        errors = [];

    for (let prop in Input) {

        if (Input[prop].length === 0) {
            errors.push({
                message: prop + ' field is required'
            });
        }
    }

    if (errors.length === 0) {
        next();
    } else {
        res.status(400).send({
            errors: errors
        });
    }
};