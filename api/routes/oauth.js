module.exports = controller => {

    controller.webserver.get('/login', (req, res) => {
        res.redirect(controller.adapter.getInstallLink());
    });

    controller.webserver.get('/oauth', async (req, res) => {

        try {
            console.log('-----/oauth/req-----');
            const authData = await controller.adapter.validateOauthCode(req.query.code);
            console.log('-----/authData/-----')
            controller.trigger('oauth_success', authData);
            res.redirect(`https://slack.com/app_redirect?app=${process.env.SLACK_APP_ID}`);
        } catch (err) {
            console.error('OAUTH ERROR: ', err);
            res.status(401);
            return res.redirect('/auth-failed.html');
        }
    });
}