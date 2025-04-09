const HomeVisitRequest = require("../models/HomeVisitRequest");
const User = require("../models/userModel");
const moment = require("moment-timezone");
const createError = require("../utils/appError");
const { getDistance } = require("geolib");

const WebSocket = require("ws");

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
    res.status(201).json(request);
  } catch (error) {
    console.error("Create request error:", error);
    next(new createError(error.message, 500));
  }
};

exports.getVetRequests = async (req, res, next) => {
  try {
    console.log("Fetching vet requests for user:", req.user._id);
    const vetLocation = req.user.location?.coordinates || [85.324, 27.7172];
    // Fetch both pending and accepted requests assigned to this vet
    const requests = await HomeVisitRequest.find({
      $or: [
        { status: "pending" }, // Available for any vet to accept
        { status: "accepted", veterinarian: req.user._id }, // Accepted by this vet
      ],
    })
      .populate("petOwner", "name phone")
      .lean();

    if (!requests.length) {
      return res.status(200).json({ status: "success", data: [] });
    }

    const enhancedRequests = requests.map((request) => {
      if (
        !request.location ||
        !Array.isArray(request.location.coordinates) ||
        request.location.coordinates.length !== 2
      ) {
        console.warn(`Invalid coordinates for request ${request._id}`);
        return { ...request, distance: 0, eta: 0 };
      }

      const distance = getDistance(
        { latitude: vetLocation[1], longitude: vetLocation[0] },
        {
          latitude: request.location.coordinates[1],
          longitude: request.location.coordinates[0],
        }
      );
      const etaMinutes = Math.round((distance / 1000 / 40) * 60);

      return {
        ...request,
        distance: distance / 1000,
        eta: etaMinutes,
      };
    });

    res.status(200).json({
      status: "success",
      data: enhancedRequests,
    });
  } catch (error) {
    console.error("Error in getVetRequests:", error);
    next(new createError(`Failed to fetch requests: ${error.message}`, 500));
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
      return next(new createError("Request already processed", 400));
    }

    const formattedDate = moment()
      .tz(vet.timezone || "UTC")
      .format("MMMM Do YYYY, h:mm a");
    const message = `Your home visit request has been accepted by Dr. ${vet.name} on ${formattedDate}`;

    const distance = getDistance(
      {
        latitude: vet.location?.coordinates[1] || 27.7172,
        longitude: vet.location?.coordinates[0] || 85.324,
      },
      {
        latitude: request.location.coordinates[1],
        longitude: request.location.coordinates[0],
      }
    );
    const etaMinutes = Math.round((distance / 1000 / 40) * 60);

    const updatedRequest = await HomeVisitRequest.findByIdAndUpdate(
      requestId,
      {
        $set: {
          veterinarian: vetId,
          status: "accepted",
          acceptedAt: new Date(),
          eta: etaMinutes,
        },
        $push: {
          statusHistory: { status: "accepted", timestamp: new Date() },
        },
      },
      { new: true, runValidators: true }
    );

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
    res.status(200).json({ status: "success", data: updatedRequest });
  } catch (error) {
    console.error("Accept request error:", error);
    next(new createError("Internal server error", 500));
  }
};

exports.completeRequest = async (req, res, next) => {
  try {
    const request = await HomeVisitRequest.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status: "completed" },
        $push: {
          statusHistory: { status: "completed", timestamp: new Date() },
        },
      },
      { new: true }
    );

    if (!request) return next(new createError("Request not found", 404));

    broadcastUpdate({ type: "REQUEST_UPDATED", data: request });
    res.json(request);
  } catch (error) {
    console.error("Complete request error:", error);
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
    console.error("Get user requests error:", error);
    next(error);
  }
};

exports.sendChatMessage = async (req, res, next) => {
  try {
    const { requestId, message } = req.body;
    const senderId = req.user._id;

    const request = await HomeVisitRequest.findById(requestId);
    if (!request) return next(new createError("Request not found", 404));

    const chatMessage = {
      sender: senderId,
      message,
      timestamp: new Date(),
    };

    const updatedRequest = await HomeVisitRequest.findByIdAndUpdate(
      requestId,
      {
        $push: { chatHistory: chatMessage },
      },
      { new: true }
    ).populate("petOwner veterinarian", "name");

    console.log("Sending chat message:", chatMessage);
    broadcastUpdate({
      type: "NEW_CHAT_MESSAGE",
      data: { requestId, message: chatMessage },
    });

    res.status(200).json({ status: "success", data: chatMessage });
  } catch (error) {
    console.error("Send chat message error:", error);
    next(new createError("Failed to send message", 500));
  }
};
