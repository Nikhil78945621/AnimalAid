const mongoose = require("mongoose");

const serviceDetailSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: true,
      enum: [
        "Eye Care",
        "Vaccination",
        "Physiotherapy",
        "Cardiology",
        "Laboratory",
        "Medical Checkup",
      ],
    },
    image: {
      type: String,
      required: true,
    },
    reasons: [
      {
        title: String,
        description: String,
      },
    ],
    solutions: [
      {
        title: String,
        description: String,
      },
    ],
    vet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceDetail", serviceDetailSchema);
