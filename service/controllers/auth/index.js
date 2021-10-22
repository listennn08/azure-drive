const { Router } = require('express');
const useUserService = require('../../graph/user');
const { catchUnhandlerError } = require('../utils');

const router = Router();

router.get('/login', async (req, res) => {
  console.log('path: ', req.query.path);
  if (req.query.path) {
    req.app.locals.backToPath = req.query.path;
  }

  const authCodeUrlParameters = {
    scopes: process.env.SCOPES.split(','),
    redirectUri: process.env.REDIRECT_URI,
    loginHint: 'matt.l.tai@pwc.com'
  };

  try {
    const authUrl = await req.app.locals.msalClient
      .getAuthCodeUrl(authCodeUrlParameters);
    res.redirect(authUrl);
  } catch (e) {
    catchUnhandlerError(res, e);
  }
});

router.get('/callback', async (req, res) => {
  const tokenRequest = {
    code: req.query.code,
    scopes: process.env.SCOPES.split(','),
    redirectUri: process.env.REDIRECT_URI,
  };

  try {
    const resp = await req.app.locals
      .msalClient.acquireTokenByCode(tokenRequest);

    req.session.userId = resp.account.homeAccountId;

    const userService = useUserService(
      req.app.locals.msalClient,
      req.session.userId,
    );

    const user = await userService.getUserDetails();

    req.app.locals.users[req.session.userId] = {
      displayName: user.displayName,
      email: user.mail || user.userPrincipalName,
    };

    // console.log('\nResponse: \n', resp)
    // res.sendStatus(200)
    if (req.app.locals.backToPath) {
      const path = req.app.locals.backToPath;
      delete req.app.locals.backToPath;
      console.log('callback: ', path)
      res.redirect(path);
    } else {
      res.redirect('/');
    }
  } catch (e) {
    catchUnhandlerError(res, e);
  }
});

module.exports = router;