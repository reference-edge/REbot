
module.exports = (app, controller) => {

    app.post('/slack/receive', (req, res) => {
        console.log('event recieved');
        console.dir(req);
        console.dir(res);
        res.status(200);
        controller.handleWebhookPayload(req, res);
    });

    app.post('/slack/interactive', (req, res) => {
        console.log('interactive event recieved');
        console.dir(req);
        console.dir(res);
        res.status(200);
        controller.handleWebhookPayload(req, res);
    });
}