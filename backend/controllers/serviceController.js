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

// Create Service Detail (Fixed)
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
      });

      res.status(201).json(newDetail);
    } catch (error) {
      next(error);
    }
  });
};

// Update Service Detail (Fixed)
exports.updateServiceDetail = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(new createError("File upload failed", 400));

    try {
      const { serviceType, reasons, solutions } = req.body;
      const updateData = {
        serviceType,
        reasons: JSON.parse(reasons),
        solutions: JSON.parse(solutions),
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
