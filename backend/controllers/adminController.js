const User = require("../models/userModel");
const createError = require("../utils/appError");

exports.getAdminDashboard = async (req, res, next) => {
  try {
    // Get user counts for dashboard stats
    const [users, vets, admins] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "vet" }),
      User.countDocuments({ role: "admin" }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        totalUsers: users + vets + admins,
        totalVets: vets,
        totalAdmins: admins,
        regularUsers: users,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password -__v");
    res.status(200).json({
      status: "success",
      results: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "vet", "admin"].includes(role)) {
      return next(createError("Invalid role specified", 400));
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return next(createError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return next(createError("User not found", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
