const logger = require('../../common/logger');
const { checkTeamMigration } = require('../../listeners/middleware/migration-filter');

module.exports = (app, controller) => {

    app.post('/post-message', async (req, res) => {

        try {
            if (!req.body.teamId) {
                return res.status(400).json({ ok: false, msg: 'team id is required' });
            }

            if (!req.body.userEmail && !req.body.channelId) {
                return res.status(400).json({ ok: false, msg: 'either user email or channel id is required' });
            }
            const isTeamMigrating = await checkTeamMigration(req.body.teamId, controller);

            if (!isTeamMigrating) {
                // to get message, teamId, userEmail/channelId and orgId in req body
                controller.trigger('post-message', [req.body]);
                return res.status(200).json({ ok: true, msg: 'message posted to slack' });
            }
            res.status(200).json({ ok: true, msg: 'team migration is in progress' });
        } catch (err) {
            logger.log(err);
        }
    });
}