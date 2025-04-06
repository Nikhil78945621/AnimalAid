const ServiceDetail = require("../models/ServiceDetail");
const createError = require("../utils/appError");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure uploads directory
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage }).single("image");

// Create Service Detail (Vet only)
exports.createServiceDetail = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(new createError("File upload failed", 400));

    try {
      const { serviceType, reasons, solutions } = req.body;

      const newDetail = await ServiceDetail.create({
        serviceType,
        image: req.file ? `uploads/${req.file.filename}` : null,
        reasons: JSON.parse(reasons),
        solutions: JSON.parse(solutions),
        vet: req.user._id,
        status: "pending", // Default status
      });

      res.status(201).json(newDetail);
    } catch (error) {
      next(error);
    }
  });
};

// Update Service Detail (Vet only)
exports.updateServiceDetail = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(new createError("File upload failed", 400));

    try {
      const { serviceType, reasons, solutions } = req.body;
      const updateData = {
        serviceType,
        reasons: JSON.parse(reasons),
        solutions: JSON.parse(solutions),
        status: "pending", // Reset to pending when updated
      };

      if (req.file) {
        updateData.image = `uploads/${req.file.filename}`;
      }

      const updated = await ServiceDetail.findOneAndUpdate(
        { _id: req.params.id, vet: req.user._id },
        updateData,
        { new: true }
      );

      if (!updated)
        return next(new createError("Service detail not found", 404));
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });
};

// Get approved service details for public view
exports.getServiceDetails = async (req, res, next) => {
  try {
    let { serviceType } = req.params;
    serviceType = serviceType
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const details = await ServiceDetail.find({
      serviceType,
      status: "approved",
    }).populate("vet", "name clinic");

    res.json(details);
  } catch (error) {
    next(error);
  }
};

// Get pending approvals (Admin only)
exports.getPendingApprovals = async (req, res, next) => {
  try {
    const pendingDetails = await ServiceDetail.find({ status: "pending" })
      .populate("vet", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      status: "success",
      results: pendingDetails.length,
      data: pendingDetails,
    });
  } catch (error) {
    next(error);
  }
};

// Approve service detail (Admin only)
exports.approveServiceDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const updated = await ServiceDetail.findByIdAndUpdate(
      id,
      {
        status: "approved",
        feedback: feedback || "Approved by admin",
      },
      { new: true }
    ).populate("vet", "name");

    if (!updated) {
      return next(new createError("Service detail not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Reject service detail (Admin only)
exports.rejectServiceDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const updated = await ServiceDetail.findByIdAndUpdate(
      id,
      {
        status: "rejected",
        feedback: feedback || "Rejected by admin",
      },
      { new: true }
    ).populate("vet", "name");

    if (!updated) {
      return next(new createError("Service detail not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Service Detail (Vet only)
exports.deleteServiceDetail = async (req, res, next) => {
  try {
    const deleted = await ServiceDetail.findOneAndDelete({
      _id: req.params.id,
      vet: req.user._id,
    });

    if (!deleted) {
      return next(new createError("Service detail not found", 404));
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
