
// const logger = require('../../common/logger');

module.exports = (app, controller) => {

    app.get('/', (req, res) => {
        res.redirect('http://www.point-of-reference.com/slack-referenceedge-integration/');
    });
}