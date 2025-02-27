const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  petOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  veterinarian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pet: {
    type: String,
    required: true,
  },
  dateTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  },
  notes: String,
  medicalHistory: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    payment: {
      amount: {
        type: Number,
        required: true,
        default: 0, // Default value for amount
      },
      status: {
        type: String,
        enum: ["pending", "paid"],
        default: "pending", // Default value for status
      },
    },
  },
  notifications: [
    {
      message: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Appointment", appointmentSchema);
