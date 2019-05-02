
const logger = require('../common/logger');

module.exports = controller => {

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
                            controller.trigger('create_channel', [auth, botInstance]);

                            if (isNew) {
                                controller.trigger('create_team', [botInstance, team]);
                            } else {
                                controller.trigger('update_team', [botInstance, team]);
                            }
                        }
                    });
                }
            });
        });
    });

    controller.on('create_team', (bot, team) => {
        controller.trigger('onboard', [bot, team]);
    });

    controller.on('update_team', (bot, team) => {
        // handle tem update
    });
}