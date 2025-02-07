const jwt = require("jsonwebtoken");
const createError = require("../utils/appError");
const User = require("../models/userModel");

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new createError("You are not logged in", 401));
  }

  try {
    const decoded = jwt.verify(token, "secretkey123");
    const user = await User.findById(decoded._id);

    if (!user) {
      return next(new createError("User no longer exists", 401));
    }

    req.user = user;

    next();
  } catch (error) {
    return next(new createError("Invalid token", 401));
  }
};
