require('dotenv').config();
const http = require('http');
const app = require('./server');
const logger = require('./common/logger');

const port = process.env.PORT || 3000;

const server = http.createServer(app);
server.listen(port, () => console.log('server started...'));

process.on('uncaughtException', err => {
    logger.log('uncaught exception encountered, exiting process', err.stack);
    process.exit(1);
});