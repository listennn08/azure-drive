const { Router } = require('express');
const { useSiteService } = require('../../graph/site');
const { catchUnhandlerError } = require('../utils');

const router = Router();

router.get('', async (req, res) => {
  try {
    const siteService = useSiteService(
      req.app.locals.msalClient,
      req.session.userId,
    );
    
    const data = await siteService.getSite();
    res.json(data);
  } catch(e) {
    catchUnhandlerError(res, e);
  }
});

module.exports = router;
