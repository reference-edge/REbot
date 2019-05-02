
const connFactory = require('../util/connection-factory');
const logger = require('../common/logger');

module.exports = controller => {

    controller.hears('', 'direct_message,direct_mention', async (bot, message) => {

        try {
            const helpUrl = `${process.env.APP_BASE_URL}/interactions`;

            if (message.text.includes('hello')) {
                bot.reply(message, `hi, you can invite me to the channel for Customer Reference Team to receive updates!`);
            } else if (message.text == 'connect to a salesforce instance') {
                let existingConn = await connFactory.getConnection(message.team_id, controller);

                if (!existingConn) {
                    const authUrl = connFactory.getAuthUrl(message.team_id);
                    bot.reply(message, `click this link to connect\n<${authUrl}|Connect to Salesforce>`);
                } else {

                    bot.startConversation(message, (err, convo) => {
                        convo.addQuestion(
                            `You're already connected to a Salesforce org. Are you sure you want to disconnect from it and connect to another org?`,
                            [{
                                pattern: bot.utterances.yes,
                                callback: async (response, convo) => {

                                    try {
                                        const revokeResult = await connFactory.revoke({
                                            revokeUrl: existingConn.oauth2.revokeServiceUrl,
                                            refreshToken: existingConn.refreshToken,
                                            teamId: message.team_id
                                        }, controller);

                                        if (revokeResult === 'success') {
                                            const authUrl = connFactory.getAuthUrl(message.team_id);
                                            bot.reply(message, `click this link to connect\n<${authUrl}|Connect to Salesforce>`);
                                        } else {
                                            logger.log(revokeResult);
                                        }
                                    } catch (err) {
                                        logger.log('revoke error:', err);
                                    }
                                    convo.next();
                                }
                            },
                            {
                                pattern: bot.utterances.no,
                                callback: (response, convo) => {
                                    convo.say(`Ok, You're still connected to your old org.`);
                                    convo.next();
                                }
                            },
                            {
                                default: true,
                                callback: (response, convo) => {
                                    convo.say(`Sorry, I didn't understand that. Please provide a yes or no response.`);
                                    convo.repeat();
                                    convo.next();
                                }
                            }], {}, 'default');
                    });
                }
            } else if (message.text.includes('help')) {
                bot.reply(message, `I can connect you to a salesforce instance.
Just type 'connect to a salesforce instance' to get started.
Please visit the <${helpUrl}|Help Page> for more information.`);
            } else {
                bot.reply(message, `Sorry, I didn't understand that. Please visit the <${helpUrl}|Help Page> for more information.`);
            }
        } catch (err) {
            logger.log(err);
        }
    });
}