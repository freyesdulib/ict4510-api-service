'use strict';

exports.get = function (req, callback) {

    callback({
        status: 200,
        data: {
            info: {
                version: '1.0',
                description: 'ICT4510 Course API Service'
            }
        }
    });
};