const { getAuthticationClient } = require('./utils');

function useSiteService(msalClient, userId) {
  const client = getAuthticationClient(msalClient, userId);

  async function getSite() {
    // const result = await client.api('/sites/pwceur.sharepoint.com:/sites/WebPlatformServiceCenter-Taiwan/lists')
    const result = await client.api('/sites/pwceur.sharepoint.com,5bbdd345-e568-4d17-8cc7-2dcf22384946,5cd41ca0-97d0-4849-9b85-add84bf5a1a3/lists/f32891e6-4282-4c00-bd18-51828912c900/items?expand=fields')
      .get();

    
    return result;
  }

  return {
    getSite
  }
}

module.exports = {
  useSiteService
}