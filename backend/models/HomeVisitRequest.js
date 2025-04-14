const mongoose = require("mongoose");

const homeVisitRequestSchema = new mongoose.Schema(
  {
    petOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A request must have a pet owner"],
    },
    veterinarian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    petType: {
      type: String,
      required: [true, "Pet type is required"],
      enum: ["Cow", "Buffalo", "Horse", "Other"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        required: [true, "Coordinates are required"],
      },
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "canceled"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      required: [true, "Priority is required"],
    },
    acceptedAt: {
      type: Date,
    },
    eta: {
      type: Number,
    },
    chatHistory: [
      {
        sender: {
          _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
        },
        message: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "accepted", "completed", "canceled"], // Changed to "canceled"
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

homeVisitRequestSchema.index({ location: "2dsphere" });

const HomeVisitRequest = mongoose.model(
  "HomeVisitRequest",
  homeVisitRequestSchema
);

module.exports = HomeVisitRequest;
