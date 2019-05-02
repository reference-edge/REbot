
const logger = require('../common/logger');
const connFactory = require('../util/connection-factory');
const { saveTeamId } = require('../util/refedge');

module.exports = controller => {

    controller.on('grid_migration_started', async (ctrl, event) => {
        console.dir(ctrl);
        console.dir(event);

        try {
            let team = await controller.storage.teams.get(event.team_id);

            if (team) {
                team.is_migrating = true;
                controller.storage.teams.save(team);
            }
        } catch (err) {
            logger.log(err);
        }
    });

    controller.on('grid_migration_finished', async (ctrl, event) => {
        console.dir(ctrl);
        console.dir(event);

        try {
            let team = await controller.storage.teams.get(event.team_id);

            if (team) {
                team.is_migrating = false;
                controller.storage.teams.save(team);
            }
        } catch (err) {
            logger.log(err);
        }
    });

    controller.on('app_uninstalled', async (ctrl, event) => {

        try {
            const existingConn = await connFactory.getConnection(event.team_id, controller);
            const channels = await controller.storage.channels.find({ team_id: event.team_id });

            if (channels && channels.length > 0) {
                const delChannelResult = await controller.storage.channels.delete(channels[0].id);
                logger.log('delete channel result:', delChannelResult);
            }

            if (existingConn) {
                let teamData = { removeTeam: event.team_id };
                saveTeamId(existingConn, teamData);
                const revokeResult = await connFactory.revoke({
                    revokeUrl: existingConn.oauth2.revokeServiceUrl,
                    refreshToken: existingConn.refreshToken,
                    teamId: event.team_id
                }, controller);
                logger.log('delete org result:', revokeResult);
            }
            const delTeamResult = await controller.storage.teams.delete(event.team_id);
            logger.log('delete team result:', delTeamResult);
        } catch (err) {
            logger.log(err);
        }
    });

    controller.on('onboard', bot => {

        bot.startPrivateConversation({ user: bot.config.createdBy }, (err, convo) => {

            if (err) {
                logger.log(err);
            } else {
                convo.say('I am a bot. I have joined your workspace. Just message me if you have any queries.\n'
                    + 'I have created a public channel for the CRP Team. '
                    + 'All updates concerning the Customer Reference Team will be posted in this channel. '
                    + 'You should add the members of the Customer Reference Team and me to this channel to receive updates.');
            }
        });
    });

    controller.on('post-message', async data => {

        try {

            if (data.teamId) {
                const team = await controller.storage.teams.get(data.teamId);

                if (!team) {
                    return logger.log('team not found, provided id:', data.teamId);
                }
                const bot = controller.spawn(team.bot);

                if (data.userEmail) {

                    bot.api.users.lookupByEmail({
                        token: team.bot.token,
                        email: data.userEmail
                    }, (err, result) => {
    
                        if (err) {
                            logger.log(err);
                        }
    
                        if (!result) {
                            return logger.log('user not found, provided email:', data.userEmail);
                        }
    
                        bot.startPrivateConversation({ user: result.user.id }, (err, convo) => {
    
                            if (err) {
                                logger.log(err);
                            } else {
                                convo.say(data.message);
                            }
                        });
                    });
                } else if (data.channelId) {
                    bot.say({ text: data.message, channel: data.channelId });
                }
            }
        } catch (err) {
            logger.log(err);
        }
    });
}