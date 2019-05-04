
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

    controller.on('create_channel', (auth, bot) => {

        bot.api.channels.create({
            token: auth.access_token,
            name: 'crp_team'
        }, (err, result) => {

            if (err) {
                return logger.log('channel create error:', err);
            }
            const crpTeamChannel = {
                id: result.channel.id,
                name: result.channel.name,
                team_id: auth.identity.team_id
            };
            controller.storage.channels.save(crpTeamChannel, (err, id) => {

                if (err) {
                    logger.log('channel save error:', err);
                }
            });
        });
    });

    controller.on('oauth_success', auth => {

        controller.storage.teams.get(auth.identity.team_id, (err, team) => {
            let isNew = false;

            if (!team) {
                team = {
                    id: auth.identity.team_id,
                    createdBy: auth.identity.user_id,
                    url: auth.identity.url,
                    name: auth.identity.team,
                    is_migrating: false
                };
                isNew = true;
            }

            team.bot = {
                token: auth.bot.bot_access_token,
                user_id: auth.bot.bot_user_id,
                createdBy: auth.identity.user_id,
                app_token: auth.access_token,
            };
            let botInstance = controller.spawn(team.bot);

            botInstance.api.auth.test({}, (err, botAuth) => {

                if (err) {
                    logger.log('auth error:', err);
                } else {
                    team.bot.name = botAuth.user;
                    botInstance.identity = botAuth;
                    botInstance.team_info = team;

                    controller.storage.teams.save(team, (saveErr, id) => {

                        if (saveErr) {
                            logger.log('team save error:', saveErr);
                        } else {

                            if (isNew) {
                                controller.trigger('create_channel', [auth, botInstance]);
                                controller.trigger('onboard', [botInstance, team]);
                            }
                        }
                    });
                }
            });
        });
    });

    controller.on('post-message', async messages => {

        try {

            messages.forEach(data => {

                if (data.teamId) {
                    const team = await controller.storage.teams.get(data.teamId);

                    if (!team) {
                        return logger.log('team not found for id:', data.teamId);
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
                                return logger.log('user not found for email:', data.userEmail);
                            }

                            bot.startPrivateConversation({ user: result.user.id }, (err, convo) => {

                                if (err) {
                                    logger.log(err);
                                } else {
                                    convo.say(data.message);
                                }
                            });
                        });
                    } else {
                        const channels = await controller.storage.channels.find({ team_id: data.teamId });

                        if (channels && channels.length > 0) {
                            bot.say({ text: data.message, channel: channels[0].id });
                        }
                    }
                }
            });
        } catch (err) {
            logger.log(err);
        }
    });
}