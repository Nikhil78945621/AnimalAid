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
  payment: {
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    transactionId: String,
    paidAt: Date,
  },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
