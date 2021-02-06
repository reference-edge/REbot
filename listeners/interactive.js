
// const logger = require('../common/logger');

module.exports = controller => {

    controller.on('interactive_message_callback', (bot, message) => {
        // logger.log('interactive message reply:', message.payload);
        bot.replyEphemeral(message, 'Thank you!!');
    });
}