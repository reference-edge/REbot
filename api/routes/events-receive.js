
module.exports = (app, controller) => {

    app.post('/slack/receive', (req, res) => {
        console.log('@@@@@@@@@@message received in app');
        res.status(200);
        controller.handleWebhookPayload(req, res);
    });

    app.post('/slack/interactive', (req, res) => {
        res.status(200);
        controller.handleWebhookPayload(req, res);
    });
}