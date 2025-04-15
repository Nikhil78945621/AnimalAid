const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createError = require("../utils/appError");

// Signup user
exports.signup = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      return next(new createError("User already exists", 400));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const newUser = await User.create({
      ...req.body,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { _id: newUser._id, role: newUser.role },
      "secretkey123",
      { expiresIn: "90d" }
    );

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return next(new createError("Invalid email or password", 401));
    }

    const token = jwt.sign({ _id: user._id, role: user.role }, "secretkey123", {
      expiresIn: "90d",
    });

    res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      token,
      data: {
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

//Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new createError("User not found", 404));
    }

    const userData = {
      name: user.name,
      email: user.email,
      role: user.role, // Ensure this is always included
      phone: user.phone,
      address: user.address,
    };

    if (user.role === "vet") {
      userData.speciality = user.speciality;
      userData.fee = user.fee;
      userData.clinic = user.clinic;
      userData.postalCode = user.postalCode;
    }

    res.status(200).json({
      status: "success",
      data: {
        user: userData,
      },
    });
  } catch (error) {
    next(error);
  }
};

//update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const updatedData = req.body;

    if (updatedData.password) {
      updatedData.password = await bcrypt.hash(updatedData.password, 12);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new createError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "profile updated successfully",
      data: {
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// authController.js
exports.logout = (req, res) => {
  res.status(200).json({
    status: "success",
    message: "User logged out successfully",
  });
};
