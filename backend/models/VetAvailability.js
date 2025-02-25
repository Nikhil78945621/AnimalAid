const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
  vet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  workingHours: [
    {
      day: {
        type: String,
        enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
      start: String,
      end: String,
      active: {
        type: Boolean,
        default: true,
      },
    },
  ],
  blockedSlots: [
    {
      start: Date,
      end: Date,
      reason: String,
    },
  ],
  appointmentDuration: {
    type: Number,
    default: 60,
  },
  timezone: {
    type: String,
    required: true,
    default: "UTC",
  },
});

module.exports = mongoose.model("VetAvailability", availabilitySchema);
