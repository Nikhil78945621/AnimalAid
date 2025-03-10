const mongoose = require("mongoose");
const { Schema } = mongoose;

const homeVisitSchema = new mongoose.Schema({
  petOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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
    enum: ["pending", "accepted", "completed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add 2dsphere index for geospatial queries
homeVisitSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("HomeVisitRequest", homeVisitSchema);
ports = mongoose.model("HomeVisitRequest", homeVisitSchema);
