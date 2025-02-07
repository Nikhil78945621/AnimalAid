const createError = require("../utils/appError");

const checkRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return next(new createError(`Access restricted to ${role}s only`, 403));
    }
    next();
  };
};

module.exports = checkRole;
