const logger = require('../../common/logger');
const { checkTeamMigration } = require('../../listeners/middleware/migration-filter');

module.exports = (app, controller) => {

    app.post('/post-message', async (req, res) => {

        try {
            console.log('in msg-handler class');
            console.dir(req);
            if (!req.body.teamId) {
                return res.status(400).json({ ok: false, msg: 'team id is required' });
            }
            // to get message, teamId, userEmail/channelId and orgId in req body
            controller.trigger('post-message', [req.body]);
            return res.status(200).json({ ok: true, msg: 'message posted to slack' });
        } catch (err) {
            logger.log(err);
        }
    });
}