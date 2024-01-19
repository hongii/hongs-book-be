const asyncWrapper = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (err) {
    return next(err);
  }
};

module.exports = { asyncWrapper };
