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
  postalCode: {
    type: String,
    required: function() {
      return this.role === "vet"; // Required for vets only
    },
  },
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
  location: {
    type: {
      type: String,
      default: "Point",
      enum: ["Point"],
    },
    coordinates: [Number], // Optional: vets can set this via postal code geocoding
  },
});

userSchema.index({ location: "2dsphere" });

const User = mongoose.model("User", userSchema);
module.exports = User;
