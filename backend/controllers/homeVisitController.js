const HomeVisitRequest = require("../models/HomeVisitRequest");
const createError = require("../utils/appError");
const User = require("../models/userModel");
const moment = require("moment-timezone");

exports.createRequest = async (req, res, next) => {
  try {
    const { petType, description, coordinates, address } = req.body;

    // Validate required fields
    if (!petType || !description || !coordinates || !address) {
      return next(new createError("All fields are required", 400));
    }

    // Validate coordinates format
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return next(new createError("Invalid coordinates format", 400));
    }

    // Create the request
    const request = await HomeVisitRequest.create({
      petOwner: req.user._id, // Ensure user is authenticated
      petType,
      description,
      location: {
        type: "Point",
        coordinates: [coordinates[0], coordinates[1]], // [lng, lat]
      },
      address,
      status: "pending",
    });

    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating home visit request:", error);
    next(new createError(error.message, 500));
  }
};
exports.getVetRequests = async (req, res, next) => {
  try {
    const requests = await HomeVisitRequest.find({ status: "pending" })
      .populate("petOwner", "name phone")
      .lean();

    res.status(200).json({
      status: "success",
      data: requests,
    });
  } catch (error) {
    next(new createError("Failed to fetch requests", 500));
  }
};

// Accept a home visit request
exports.acceptRequest = async (req, res, next) => {
  try {
    const { id: requestId } = req.params;
    const vetId = req.user._id;

    // Fetch vet and request
    const [vet, request] = await Promise.all([
      User.findById(vetId),
      HomeVisitRequest.findById(requestId),
    ]);

    if (!vet) return next(new createError("Vet not found", 404));
    if (!request) return next(new createError("Request not found", 404));

    // Format the acceptance message
    const formattedDate = moment()
      .tz(vet.timezone || "UTC")
      .format("MMMM Do YYYY, h:mm a");
    const message = `Your home visit request has been accepted by Dr. ${vet.name} on ${formattedDate}`;

    // Add notification to the user
    await User.findByIdAndUpdate(request.petOwner, {
      $push: {
        notifications: {
          message,
          type: "home-visit",
          read: false,
        },
      },
    });

    // Update the request status
    const updatedRequest = await HomeVisitRequest.findByIdAndUpdate(
      requestId,
      {
        $set: {
          veterinarian: vetId,
          status: "accepted",
          acceptedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Accept request error:", error);
    next(new createError("Internal server error", 500));
  }
};

exports.completeRequest = async (req, res, next) => {
  try {
    const request = await HomeVisitRequest.findByIdAndUpdate(
      req.params.id,
      { status: "completed" },
      { new: true }
    );

    if (!request) return next(new createError("Request not found", 404));

    res.json(request);
  } catch (error) {
    next(error);
  }
};

exports.getUserRequests = async (req, res, next) => {
  try {
    const requests = await HomeVisitRequest.find({
      petOwner: req.user._id,
    }).populate("veterinarian", "name phone");

    res.json(requests);
  } catch (error) {
    next(error);
  }
};
