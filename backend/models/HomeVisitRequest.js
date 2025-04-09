const mongoose = require("mongoose");
const { Schema } = mongoose;

const homeVisitSchema = new mongoose.Schema({
  petOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  veterinarian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  petType: {
    type: String,
    required: true,
    enum: ["Cow", "Buffalo", "Horse", "Other"],
  },
  description: String,
  location: {
    type: {
      type: String,
      default: "Point",
      enum: ["Point"],
    },
    coordinates: [Number],
  },
  address: String,
  status: {
    type: String,
    enum: ["pending", "accepted", "in-progress", "completed", "cancelled"],
    default: "pending",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },
  eta: Number,
  chatHistory: [
    {
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      message: String,
      timestamp: Date,
    },
  ],
  statusHistory: [
    {
      status: String,
      timestamp: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: Date,
});

homeVisitSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("HomeVisitRequest", homeVisitSchema);
