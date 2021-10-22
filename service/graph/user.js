const { getAuthticationClient } = require('./utils');

function useUserService(msalClient, userId) {
  const client = getAuthticationClient(msalClient, userId);

  async function getUserDetails() {
    const user = await client
      .api('/me')
      .version("beta")
      .select('displayName,mail,userPrincipalName')
      .get();
  
    return user;
  }

  return {
    getUserDetails,
  }
}

module.exports = useUserService;
