'use strict';

exports.get = function (req, callback) {

    callback({
        status: 200,
        data: {
            info: {
                version: '2.0',
                description: 'ICT4510 Course API Service | Provides example code for students to review.'
            }
        }
    });
};