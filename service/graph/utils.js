const graph = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

exports.getAuthticationClient = function(msalClient, userId) {
  if (!msalClient || !userId) {
    throw new Error(
      `Invalid MSAL state. Client: ${msalClient ? 'present' : 'missing'}, `+
        `User ID: ${userId ? 'present' : 'missing'}`
    );
  }

  const client = graph.Client.init({
    async authProvider(done) {
      try {
        const account = await msalClient
          .getTokenCache()
          .getAccountByHomeId(userId)

        if (account) {
          const response = await msalClient.acquireTokenSilent({
            scopes: process.env.SCOPES.split(','),
            redirectUri: process.env.REDIRECT_URI,
            account,
          });

          done(null, response.accessToken);
        }
      } catch (e) {
        console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        done(err, null);
      }
    }
  });

  return client;
};
