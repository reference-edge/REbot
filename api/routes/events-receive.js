
module.exports = (app, controller) => {

    app.post('/slack/receive', (req, res) => {
        res.status(200);
        controller.handleWebhookPayload(req, res);
    });

    app.post('/slack/interactive', (req, res) => {
        res.status(200);
        controller.handleWebhookPayload(req, res);
    });
}