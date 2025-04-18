const VetApplication = require("../models/VetApplication");
const User = require("../models/userModel");
const createError = require("../utils/appError");
exports.submitVetApplication = async (req, res, next) => {
  try {
    if (!VetApplication || typeof VetApplication.findOne !== "function") {
      return next(
        new createError("VetApplication model is not properly defined", 500)
      );
    }

    const { qualifications, experience, specialty } = req.body;
    const userId = req.user._id;

    const existingApplication = await VetApplication.findOne({
      user: userId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingApplication) {
      return next(
        new createError(
          "You already have a pending or approved vet application",
          400
        )
      );
    }

    const application = await VetApplication.create({
      user: userId,
      qualifications,
      experience,
      specialty,
    });

    res.status(201).json({
      status: "success",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// Get all pending applications (admin only)
exports.getPendingApplications = async (req, res, next) => {
  try {
    const applications = await VetApplication.find({ status: "pending" })
      .populate("user", "name email")
      .sort({ submittedAt: -1 });

    res.status(200).json({
      status: "success",
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// Review application (admin only)
exports.reviewApplication = async (req, res, next) => {
  try {
    const { applicationId, status } = req.body; // status: "approved" or "rejected"
    const adminId = req.user._id;

    if (!["approved", "rejected"].includes(status)) {
      return next(new createError("Invalid status", 400));
    }

    const application = await VetApplication.findById(applicationId);
    if (!application) {
      return next(new createError("Application not found", 404));
    }

    // Update application status
    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = adminId;
    await application.save();

    // If approved, update user role to "vet"
    if (status === "approved") {
      await User.findByIdAndUpdate(application.user, { role: "vet" });

      // Notify user
      await User.findByIdAndUpdate(application.user, {
        $push: {
          notifications: {
            message: "Your vet application has been approved!",
            type: "vet_application",
            read: false,
            createdAt: new Date(),
          },
        },
      });
    } else {
      // Notify user of rejection
      await User.findByIdAndUpdate(application.user, {
        $push: {
          notifications: {
            message: "Your vet application has been rejected.",
            type: "vet_application",
            read: false,
            createdAt: new Date(),
          },
        },
      });
    }

    res.status(200).json({
      status: "success",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};
