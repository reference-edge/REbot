const Botkit = require('botkit');
const mongoProvider = require('./db/mongo-provider')({
    mongoUri: process.env.MONGO_CONNECTION_STRING
});

const eventListeners = require('./listeners/events');
const basicListener = require('./listeners/basic-ears');
const interactiveListener = require('./listeners/interactive');
const { getFilterMiddleware } = require('./listeners/middleware/migration-filter');

let botCfg = {
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    //update to granular scopes 
    scopes: ['channels:join',
        'channels:manage',
        'channels:read',
        'incoming-webhook',
        'team:read',
        'users:read',
        'users:read.email',
        'users:write', 'team:read', 'users:read', 'users:read.email', 'channels:write'],
    storage: mongoProvider,
    clientSigningSecret: process.env.SLACK_SIGNING_SECRET,
    oauthVersion = 'v2'
};

let controller = Botkit.slackbot(botCfg);
console.log('!-------------Controller value SlackBot--------------!');
console.dir(controller);
controller.startTicking();
controller.middleware.receive.use(getFilterMiddleware(controller));

eventListeners(controller);
basicListener(controller);
interactiveListener(controller);

module.exports = controller;