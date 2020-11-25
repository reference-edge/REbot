require('dotenv').config();

const { Botkit } = require('botkit');
const { SlackAdapter, SlackMessageTypeMiddleware, SlackEventMiddleware } = require('botbuilder-adapter-slack');
const projectId = process.env.PROJECT_ID;
const client_email = process.env.CLIENT_EMAIL;
const private_key = process.env.PRIVATE_KEY.replace(/\\n/gm, '\n');

const dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    projectId,
    credentials: {
        client_email,
        private_key
    }
});
const mongoProvider = require('./db/mongo-provider')({
    mongoUri: process.env.MONGO_CONNECTION_STRING
});
const authRouter = require('./api/routes/oauth');
const sfAuthRouter = require('./api/routes/sfauth');
const sfMsgRouter = require('./api/routes/msg-handler'); 
const viewsRouter = require('./api/routes/views');

const adapter = new SlackAdapter({
    clientSigningSecret: process.env.SLACK_SIGNING_SECRET,
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    scopes: [
    'calls:read',
    'channels:history',
    'team:read', 
    'users:read',
    'users.profile:read', 
    'users:read.email', 
    'commands',
    'groups:history',
    'im:history',
    'im:read',
    'im:write',
    'incoming-webhook',
    'links:read',
    'mpim:history',
    'mpim:read',
    'mpim:write',
    'reactions:read',
    'users.profile:read'
    ],
    redirectUri: process.env.SLACK_REDIRECT_URI,
    getTokenForTeam: getTokenForTeam,
    getBotUserByTeam: getBotUserByTeam,
    oauthVersion: 'v2'

});
adapter.use(new SlackEventMiddleware());
adapter.use(new SlackMessageTypeMiddleware());

const controller = new Botkit({
    webhook_uri: '/slack/receive',
    adapter
});

controller.addPluginExtension('database', mongoProvider);

controller.middleware.receive.use(dialogflowMiddleware.receive);

controller.ready(() => {
    controller.loadModules(__dirname + '/dialogs');
    controller.loadModules(__dirname + '/listeners');
    console.log('----------------Ready-----------------');
    authRouter(controller);
    sfAuthRouter(controller);
    sfMsgRouter(controller);
    viewsRouter(controller);
});

async function getTokenForTeam(teamId) {
    console.log('@@@@@team id in getTokenForTeam', teamId);
    try {
        const teamData = await controller.plugins.database.teams.get(teamId);
        console.log('@@@@@team data in getTokenForTeam', teamData);
        if (!teamData) {
            console.log('team not found for id: ', teamId);
        }
        return teamData.bot.token;
    } catch (err) {
        console.log(err);
    }
}

async function getBotUserByTeam(teamId) {
    console.log('@@@@@team id in getBotUserByTeam', teamId);
    try {
        const teamData = await controller.plugins.database.teams.get(teamId);
        console.log('@@@@@team teamData in getBotUserByTeam', teamData);
        if (!teamData) {
            console.log('team not found for id: ', teamId);
        }
        return teamData.bot.user_id;
    } catch (err) {
        console.log(err);
    }
}

module.exports = controller;