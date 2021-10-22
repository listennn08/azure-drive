const { Router } = require('express');
const useUserService = require('../../graph/user');

const router = Router();

router.get('/profile', async (req, res) => {
  try {
    const userService = useUserService(
      req.app.locals.msalClient,
      req.session.userId,
    );

    const user = await userService.getUserDetails();

    res.json(user);
  } catch (e) {
    catchUnhandlerError(res, e)
  }
});

module.exports = router