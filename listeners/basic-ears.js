
const connFactory = require('../util/connection-factory');
const refedgeUtil = require('../util/refedge');
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
            } else if (message.text.includes('show accounts')) {
                const accList = await refedgeUtil.getAccounts(message.team_id, controller);
                let replyBody = {
                    text: 'Found following accounts.',
                    attachments: []
                };

                accList.records.forEach(acc => {
                    replyBody.attachments.push({
                        title: acc.Name,
                        callback_id: acc.Id,
                        attachment_type: 'default',
                        actions: [
                            { name: 'yes', text: 'Yes', value: 'yes', type: 'button' },
                            { name: 'no', text: 'No', value: 'no', type: 'button' }
                        ]
                    });
                });
                bot.reply(message, replyBody);
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

    /* controller.hears(['^hello$'], 'direct_message,direct_mention', (bot, message) => {
        // console.log(bot.team_info.id == message.team_id);
        bot.reply(message, `hi, you can invite me to the channel for Customer Reference Team to receive updates!`);
    });

    controller.hears(['show accounts'], 'direct_message,direct_mention,mention', async (bot, message) => {

        try {
            const accList = await refedgeUtil.getAccounts(message.team_id, controller);
            let replyBody = {
                text: 'Found following accounts.',
                attachments: []
            };

            accList.records.forEach(acc => {
                replyBody.attachments.push({
                    title: acc.Name,
                    callback_id: acc.Id,
                    attachment_type: 'default',
                    actions: [
                        { name: 'yes', text: 'Yes', value: 'yes', type: 'button' },
                        { name: 'no', text: 'No', value: 'no', type: 'button' }
                    ]
                });
            });
            bot.reply(message, replyBody);
        } catch (err) {

            if (err.message === 'not connected to salesforce.') {
                const authUrl = connFactory.getAuthUrl(message.team_id);
                bot.reply(message, `You're not connected to a Salesforce org. Would you like to do that now?\n<${authUrl}|Connect to Salesforce>`);
            } else {
                logger.log(err);
            }
        }
    });

    controller.hears(['connect to a salesforce org'], 'direct_message', async (bot, message) => {

        try {
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
                                        // convo.say(revokeResult);
                                        // log result
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
        } catch (err) {
            logger.log(err);
        }
    }); */
}