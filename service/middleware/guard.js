const guardPath = ['user', 'drive'];

exports.visitGuard = function (req, res, next) {
  const path = req.url.replace(/\/api\//, '');
  const regexp = new RegExp(`^[${guardPath.join(',')}]`, 'gi')
  if (regexp.test(path) && !req.session.userId) {
    return res.status(401).send();
  }

  next();
}