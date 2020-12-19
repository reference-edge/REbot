module.exports = controller => {

    controller.webserver.get('/login', (req, res) => {
        res.redirect(controller.adapter.getInstallLink());
    });

    controller.webserver.get('/oauth', async (req, res) => {

        try {
            console.log('-----/oauth/req-----');
            /*console.dir(req);
            if (!req.query.state) {
                return res.redirect('/auth-failed.html?error=missing_state_param');
            }

            if (process.env.STATE != req.query.state) {
                return res.redirect('/auth-failed.html?error=invalid_state_param');
            }*/
            const authData = await controller.adapter.validateOauthCode(req.query.code);
            console.log('-----/authData/-----')
            console.dir(req.query)
            controller.trigger('oauth_success', authData);
            res.redirect(`https://slack.com/app_redirect?app=${process.env.SLACK_APP_ID}`);
        } catch (err) {
            console.error('OAUTH ERROR: ', err);
            res.status(401);
            return res.redirect('/auth-failed.html');
        }
    });
}