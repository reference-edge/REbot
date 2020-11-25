
const connFactory = require('../../util/connection-factory');
const { saveTeamId } = require('../../util/refedge');
const logger = require('../../common/logger');

module.exports = controller => {

    controller.webserver.get('/sfauth/callback', async (req, res) => {

        try {

            if (req.query.error) {
                logger.log('salesforce auth error:', req.query.error);
                res.status(401);
                res.redirect('/auth-failed.html');
            }

            if (req.query.code && req.query.state) {
                let conn = await connFactory.connect(req.query.code, controller, req.query.state);
                let teamData = { addTeam: req.query.state };
                saveTeamId(conn, teamData);
                res.status(302);
                res.redirect('/auth-success.html');
            }
        } catch (err) {
            logger.log('salesforce auth error:', err);
        }
    });
}