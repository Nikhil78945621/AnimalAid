const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "vet", "admin"],
    default: "user",
  },
  speciality: String,
  phone: String,
  address: String,
  clinic: String,
  fee: {
    type: Number,
    required: function() {
      return this.role === "vet";
    },
    default: 0,
    min: [0, "Fee cannot be negative"],
  },
  timezone: {
    type: String,
    default: "UTC",
  },
  // Add notifications array
  notifications: [
    {
      message: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["appointment", "home-visit", "system"],
        default: "system",
      },
      read: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const User = mongoose.model("User", userSchema);
module.exports = User;
