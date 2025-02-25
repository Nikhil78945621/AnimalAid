const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
    default: "user",
  },
  speciality: String,
  phone: String,
  address: String,
  clinic: String,
  fee: {
    type: Number,
    required: function () {
      return this.role === "vet";
    },
    default: 0,
    min: [0, "Fee cannot be negative"],
  },
  notifications: [
    {
      type: {
        type: String,
        required: true,
      },
      message: String,
      appointmentId: mongoose.Schema.Types.ObjectId,
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
