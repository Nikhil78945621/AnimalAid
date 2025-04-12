const HomeVisitRequest = require("../models/HomeVisitRequest");
const User = require("../models/userModel");
const moment = require("moment-timezone");
const createError = require("../utils/appError");
const axios = require("axios");
const WebSocket = require("ws");

// In-memory cache for vet coordinates
const vetCoordsCache = new Map();

const broadcastUpdate = (data) => {
  if (global.wss) {
    global.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  } else {
    console.error("WebSocket server (wss) not initialized");
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const calculateDistance = async (
  vetPostalCode,
  requestCoordinates,
  retries = 3
) => {
  if (
    !vetPostalCode ||
    typeof vetPostalCode !== "string" ||
    vetPostalCode.trim() === ""
  ) {
    throw new Error("Vet postal code is missing or invalid");
  }

  if (
    !requestCoordinates ||
    !Array.isArray(requestCoordinates) ||
    requestCoordinates.length !== 2 ||
    isNaN(requestCoordinates[0]) ||
    isNaN(requestCoordinates[1])
  ) {
    throw new Error("Invalid request coordinates");
  }

  try {
    let vetCoords = vetCoordsCache.get(vetPostalCode);
    if (!vetCoords) {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const vetResponse = await axios.get(
            `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
              vetPostalCode
            )}&format=json&limit=1`
          );
          if (vetResponse.data.length === 0) {
            throw new Error(
              `No coordinates found for postal code: ${vetPostalCode}`
            );
          }
          vetCoords = [
            parseFloat(vetResponse.data[0].lon),
            parseFloat(vetResponse.data[0].lat),
          ];
          vetCoordsCache.set(vetPostalCode, vetCoords);
          break;
        } catch (error) {
          if (error.response && error.response.status === 429) {
            if (attempt === retries) {
              throw new Error(
                "Max retries reached for geocoding due to rate limit"
              );
            }
            const backoff = Math.pow(2, attempt) * 1000;
            console.warn(
              `Rate limit hit for postal code "${vetPostalCode}". Retrying in ${backoff}ms...`
            );
            await delay(backoff);
          } else {
            throw error;
          }
        }
      }
    }

    const requestCoords = requestCoordinates;

    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(requestCoords[1] - vetCoords[1]);
    const dLon = toRad(requestCoords[0] - vetCoords[0]);
    const lat1 = toRad(vetCoords[1]);
    const lat2 = toRad(requestCoords[1]);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  } catch (error) {
    console.error(
      `Distance calculation error for postal code "${vetPostalCode}":`,
      error.message
    );
    throw error;
  }
};

exports.createRequest = async (req, res, next) => {
  try {
    const { petType, description, coordinates, address, priority } = req.body;

    if (!petType || !description || !coordinates || !address || !priority) {
      return next(new createError("All fields are required", 400));
    }

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return next(new createError("Invalid coordinates format", 400));
    }

    const request = await HomeVisitRequest.create({
      petOwner: req.user._id,
      petType,
      description,
      location: {
        type: "Point",
        coordinates: [coordinates[0], coordinates[1]],
      },
      address,
      status: "pending",
      priority,
      chatHistory: [],
      statusHistory: [{ status: "pending", timestamp: new Date() }],
    });

    broadcastUpdate({ type: "NEW_REQUEST", data: request });
    res.status(201).json({
      status: "success",
      data: request,
      message: "Home visit request created successfully.",
    });
  } catch (error) {
    console.error("Create request error:", error);
    next(new createError(error.message, 500));
  }
};

exports.acceptRequest = async (req, res, next) => {
  try {
    const { id: requestId } = req.params;
    const vetId = req.user._id;

    const [vet, request] = await Promise.all([
      User.findById(vetId),
      HomeVisitRequest.findById(requestId),
    ]);

    if (!vet) return next(new createError("Vet not found", 404));
    if (!request) return next(new createError("Request not found", 404));
    if (request.status !== "pending") {
      return next(
        new createError("This request has already been processed", 400)
      );
    }

    const distance = await calculateDistance(
      vet.postalCode,
      request.location.coordinates
    );
    if (distance > 100) {
      return next(new createError("Request is beyond 100 km radius", 403));
    }

    const updatedRequest = await HomeVisitRequest.findOneAndUpdate(
      { _id: requestId, status: "pending" },
      {
        $set: {
          veterinarian: vetId,
          status: "accepted",
          acceptedAt: new Date(),
          eta: Math.round((distance / 40) * 60),
        },
        $push: {
          statusHistory: { status: "accepted", timestamp: new Date() },
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return next(
        new createError("Request was already accepted by another vet", 400)
      );
    }

    const formattedDate = moment()
      .tz(vet.timezone || "UTC")
      .format("MMMM Do YYYY, h:mm a");
    const message = `Your home visit request has been accepted by Dr. ${
      vet.name
    } on ${formattedDate} (Estimated distance: ${distance.toFixed(2)} km)`;

    await User.findByIdAndUpdate(request.petOwner, {
      $push: {
        notifications: {
          message,
          type: "home-visit",
          read: false,
        },
      },
    });

    broadcastUpdate({ type: "REQUEST_UPDATED", data: updatedRequest });

    res.status(200).json({
      status: "success",
      data: updatedRequest,
      message: `Request accepted successfully. Distance: ${distance.toFixed(
        2
      )} km.`,
    });
  } catch (error) {
    console.error("Accept request error:", error);
    next(error);
  }
};

exports.getVetRequests = async (req, res, next) => {
  try {
    const vet = await User.findById(req.user._id);
    if (!vet) return next(new createError("Vet not found", 404));

    if (!vet.postalCode || vet.postalCode.trim() === "") {
      console.warn(`Vet ${vet._id} has no valid postal code`);
      return res.status(200).json({
        status: "success",
        data: [],
        message: "No requests available due to missing vet postal code",
      });
    }

    const requests = await HomeVisitRequest.find({
      $or: [
        { status: "pending" },
        { status: "accepted", veterinarian: req.user._id },
      ],
    })
      .populate("petOwner", "name phone")
      .lean();

    const enhancedRequests = await Promise.all(
      requests.map(async (request) => {
        let distance = null;
        let etaMinutes = 0;
        let isEligible = false;

        try {
          distance = await calculateDistance(
            vet.postalCode,
            request.location.coordinates
          );
          distance = Number(distance);
          isEligible = distance <= 100;
          etaMinutes = isEligible ? Math.round((distance / 40) * 60) : 0;
        } catch (error) {
          console.warn(
            `Skipping request ${request._id} due to distance calculation failure: ${error.message}`
          );
          return null;
        }

        return {
          ...request,
          distance,
          eta: etaMinutes,
          isEligible,
        };
      })
    );

    const filteredRequests = enhancedRequests
      .filter(
        (request) =>
          request !== null &&
          ((request.status === "pending" && request.isEligible) ||
            (request.status === "accepted" &&
              request.veterinarian.toString() === vet._id.toString()))
      )
      .map((request) => ({
        ...request,
        distance: request.distance,
      }));

    res.status(200).json({
      status: "success",
      data: filteredRequests,
    });
  } catch (error) {
    console.error("Error in getVetRequests:", error);
    next(new createError(`Failed to fetch requests: ${error.message}`, 500));
  }
};

exports.completeRequest = async (req, res, next) => {
  try {
    const { id: requestId } = req.params;
    const vetId = req.user._id;

    const request = await HomeVisitRequest.findOne({
      _id: requestId,
      veterinarian: vetId,
      status: "accepted",
    });

    if (!request) {
      return next(
        new createError("Request not found or not assigned to you", 404)
      );
    }

    const updatedRequest = await HomeVisitRequest.findByIdAndUpdate(
      requestId,
      {
        $set: { status: "completed" },
        $push: {
          statusHistory: { status: "completed", timestamp: new Date() },
        },
      },
      { new: true, runValidators: true }
    );

    const message = `Your home visit request has been completed by Dr. ${
      req.user.name
    } on ${moment().format("MMMM Do YYYY, h:mm a")}`;

    await User.findByIdAndUpdate(request.petOwner, {
      $push: {
        notifications: {
          message,
          type: "home-visit",
          read: false,
        },
      },
    });

    broadcastUpdate({ type: "REQUEST_UPDATED", data: updatedRequest });

    res.status(200).json({
      status: "success",
      data: updatedRequest,
      message: "Request marked as completed.",
    });
  } catch (error) {
    console.error("Complete request error:", error);
    next(error);
  }
};

exports.getUserRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const requests = await HomeVisitRequest.find({ petOwner: userId })
      .populate("petOwner", "name phone")
      .populate("veterinarian", "name phone")
      .lean();

    res.status(200).json({
      status: "success",
      data: requests || [],
    });
  } catch (error) {
    console.error("Error in getUserRequests:", error);
    next(
      new createError(`Failed to fetch user requests: ${error.message}`, 500)
    );
  }
};

exports.sendChatMessage = async (req, res, next) => {
  try {
    const { requestId, message } = req.body;
    const senderId = req.user._id;

    if (!requestId || !message) {
      return next(new createError("Request ID and message are required", 400));
    }

    const request = await HomeVisitRequest.findById(requestId);
    if (!request) {
      return next(new createError("Request not found", 404));
    }

    // Log for debugging
    console.log("sendChatMessage:", {
      senderId: senderId.toString(),
      petOwner: request.petOwner?.toString(),
      veterinarian: request.veterinarian?.toString(),
      requestId,
      message,
    });

    if (
      request.petOwner.toString() !== senderId.toString() &&
      request.veterinarian?.toString() !== senderId.toString()
    ) {
      return next(
        new createError(
          "You are not authorized to send messages for this request",
          403
        )
      );
    }

    const sender = await User.findById(senderId).select("name _id");
    if (!sender) {
      return next(new createError("Sender not found", 404));
    }

    const chatMessage = {
      sender: {
        _id: sender._id,
        name: sender.name,
      },
      message,
      timestamp: new Date(),
    };

    const updatedRequest = await HomeVisitRequest.findByIdAndUpdate(
      requestId,
      {
        $push: { chatHistory: chatMessage },
      },
      { new: true }
    );

    // Log the saved message for verification
    console.log("Saved chat message:", chatMessage);

    broadcastUpdate({
      type: "NEW_CHAT_MESSAGE",
      data: { requestId, message: chatMessage },
    });

    res.status(200).json({
      status: "success",
      data: updatedRequest,
      message: "Message sent successfully.",
    });
  } catch (error) {
    console.error("Send chat message error:", error);
    next(error);
  }
};
