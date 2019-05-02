const Botkit = require('botkit');
const mongoProvider = require('./db/mongo-provider')({
    mongoUri: `mongodb+srv://REFEDGE_USER_1:${process.env.MONGO_PW}@cluster1refedge-cuehc.mongodb.net/${process.env.DB_NAME}?retryWrites=true`
});

const saveTeamUtil = require('./util/save-team');
const createChannelUtil = require('./util/create-channel');
const eventListeners = require('./listeners/events');
const basicListener = require('./listeners/basic-ears');
const interactiveListener = require('./listeners/interactive');
const { getFilterMiddleware } = require('./listeners/middleware/migration-filter');

let botCfg = {
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    scopes: ['bot', 'team:read', 'users:read', 'users:read.email', 'channels:write'],
    storage: mongoProvider,
    clientSigningSecret: process.env.SLACK_SIGNING_SECRET
};

let controller = Botkit.slackbot(botCfg);
controller.startTicking();
controller.middleware.receive.use(getFilterMiddleware(controller));

saveTeamUtil(controller);
createChannelUtil(controller);
eventListeners(controller);
basicListener(controller);
interactiveListener(controller);

module.exports = controller;