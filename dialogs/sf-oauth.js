const { BotkitConversation } = require('botkit');
const connFactory = require('../util/connection-factory');

module.exports = controller => {
    let convo = new BotkitConversation('sf_auth', controller);
    

    convo.addMessage({
        ephemeral: true,
        text: `Ok, You are still connected to your old Salesforce instance.`,
        action: 'complete'
    }, 'no_thread');

    convo.addMessage({
        ephemeral: true,
        text: `Sorry, I didn't understand that. Please provide a yes or no response.`,
        action: 'default'
    }, 'bad_response');

    convo.addMessage({
        ephemeral: true,
        text: `click this link to connect\n<{{&vars.authUrl}}|Connect to Salesforce>`,
        action: 'complete'
    }, 'connect');

    convo.addQuestion(
        {
            ephemeral: true,
            text: 'You are already connected to a Salesforce instance. Are you sure you want to disconnect from it and connect to another instance?'
        }, [
        {
            pattern: '^(yes|yea|yup|yep|ya|sure|ok|y|yeah|yah)',
            handler: async function(response, convo, bot) {
                let teamResponse = await bot.api.team.info();
                let existingConn = await connFactory.getConnection(teamResponse.team.id, controller);
                try{
                    const revokeResult = await connFactory.revoke({
                        revokeUrl: existingConn.oauth2.revokeServiceUrl,
                        refreshToken: existingConn.refreshToken,
                        teamId: teamResponse.team.id
                    }, controller);
                    if (revokeResult === 'success') {
                        const authUrl = connFactory.getAuthUrl(teamResponse.team.id);
                        convo.setVar('authUrl',authUrl);
                        await convo.gotoThread('connect');
                    }else {
                        logger.log(revokeResult);
                    }
                } catch(err) {
                    logger.log('revoke error:', err);
                }
            }
        },
        {
            pattern: '^(no|nah|nope|n)',
            handler: async function(response, convo, bot) {
                console.log('response----');
                console.log(response);
                await convo.gotoThread('no_thread');
            }
        },
        {
            default: true,
            handler: async function(response, convo, bot) {
                console.log('response----');
                console.log(response);
                await convo.gotoThread('bad_response');
            }
        }
    ], 'reconnect', 'default');

    controller.addDialog(convo);
}


