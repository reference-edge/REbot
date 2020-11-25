
// const logger = require('../../common/logger');

module.exports = (app, controller) => {

    controller.webserver.get('/', (req, res) => {
        res.redirect('http://www.point-of-reference.com/slack-referenceedge-integration/');
    });
}