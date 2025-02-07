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
    default: 30,
  },
});

module.exports = mongoose.model("VetAvailability", availabilitySchema);
