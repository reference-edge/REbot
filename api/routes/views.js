
// const logger = require('../../common/logger');

module.exports = (app, controller) => {

    app.get('/', (req, res) => {
        res.redirect('/index.html');
    });

    app.get('/interactions', (req, res) => {
        res.redirect('/interactions.html');
    });
}