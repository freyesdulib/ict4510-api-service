'use strict';

if (process.env.NODE_ENV === undefined) {
    require('dotenv').load();
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const express = require('./config/express');
const app = express();

const port = process.env.PORT || 3000;
app.listen(port);

console.log('ICT4510 API service running at http://' + process.env.APP_HOST + ':' + port + ' in ' + process.env.NODE_ENV + ' mode.');

module.exports = app;