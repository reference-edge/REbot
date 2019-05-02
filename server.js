
const fs = require('fs');
const bodyParser = require('body-parser');
const botController = require('./bot');
const express = require('express');
const app = express();

const corsMiddleware = require('./api/middleware/cors');
const errorHandlerMiddleware = require('./api/middleware/error-handler');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(corsMiddleware);

let routersDir = require('path').join(__dirname, 'api/routes');
fs.readdirSync(routersDir).forEach(file => {
    require('./api/routes/' + file)(app, botController);
});

app.use(errorHandlerMiddleware.notFound);
app.use(errorHandlerMiddleware.internalError);

module.exports = app;