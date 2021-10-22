exports.catchUnhandlerError = function(res, e) {
  const isDev = process.env.NODE_ENV === 'development';

  console.error(e);

  res.status(500).json({
    message: isDev ? e : 'Sorry, Something wrong...',
  });
}