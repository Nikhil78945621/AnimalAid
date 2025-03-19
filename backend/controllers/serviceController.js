const ServiceDetail = require("../models/ServiceDetail");
const createError = require("../utils/appError");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Use the uploads directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage }).single("image");

exports.createServiceDetail = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer Error:", err);
      return next(new createError("File upload failed", 400));
    }

    try {
      const { serviceType, reasons, solutions } = req.body;
      const imagePath = req.file ? req.file.path : null;

      const newDetail = await ServiceDetail.create({
        serviceType,
        image: imagePath,
        reasons: JSON.parse(reasons),
        solutions: JSON.parse(solutions),
        vet: req.user._id,
      });

      res.status(201).json(newDetail);
    } catch (error) {
      console.error("Create Service Error:", error);
      next(error);
    }
  });
};

exports.getServiceDetails = async (req, res, next) => {
  try {
    let { serviceType } = req.params;
    serviceType = serviceType
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const details = await ServiceDetail.find({ serviceType }).populate(
      "vet",
      "name clinic"
    );
    res.json(details);
  } catch (error) {
    next(error);
  }
};

exports.updateServiceDetail = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return next(new createError("File upload failed", 400));
    }

    try {
      const { serviceType, reasons, solutions } = req.body;
      const updateData = {
        serviceType,
        reasons: JSON.parse(reasons),
        solutions: JSON.parse(solutions),
      };

      if (req.file) {
        updateData.image = req.file.path;
      }

      const updated = await ServiceDetail.findOneAndUpdate(
        { _id: req.params.id, vet: req.user._id },
        updateData,
        { new: true }
      );

      if (!updated) {
        return next(new createError("Service detail not found", 404));
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  });
};

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
