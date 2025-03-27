const Appointment = require("../models/Appointment");
const VetAvailability = require("../models/VetAvailability");
const createError = require("../utils/appError");
const User = require("../models/userModel");
const moment = require("moment-timezone");
const CryptoJS = require("crypto-js");

// Helper function to generate time slots
const generateTimeSlots = (start, end, duration) => {
  const slots = [];
  let current = new Date(start);
  const endTime = new Date(end);

  while (current < endTime) {
    slots.push(new Date(current));
    current.setMinutes(current.getMinutes() + duration);
  }
  return slots;
};

// Get available slots for a vet
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { vetId, date } = req.query;

    // Fetch vet availability
    const vetAvailability = await VetAvailability.findOne({ vet: vetId });
    if (!vetAvailability) {
      return next(new createError("Vet availability not found", 404));
    }

    const vetTimezone = vetAvailability.timezone;
    const inputDate = moment.tz(date, "YYYY-MM-DD", vetTimezone);
    const day = inputDate.format("ddd");

    // Find working hours for the selected day
    const workingDay = vetAvailability.workingHours.find(
      (wh) => wh.day === day
    );
    if (!workingDay || !workingDay.active) {
      return res.json({ timezone: vetTimezone, slots: [] });
    }

    // Generate time slots based on working hours and appointment duration
    const start = inputDate.clone().set({
      hour: workingDay.start.split(":")[0],
      minute: workingDay.start.split(":")[1],
    });
    const end = inputDate.clone().set({
      hour: workingDay.end.split(":")[0],
      minute: workingDay.end.split(":")[1],
    });

    const slots = [];
    let current = start.clone();
    while (current.isBefore(end)) {
      slots.push(current.clone());
      current.add(vetAvailability.appointmentDuration, "minutes");
    }

    // Convert slots to UTC for comparison
    const utcSlots = slots.map((slot) => slot.utc().toDate());

    // Check existing appointments
    const bookedAppointments = await Appointment.find({
      veterinarian: vetId,
      dateTime: { $in: utcSlots },
    });

    // Check blocked slots
    const blockedSlots = vetAvailability.blockedSlots.filter((blocked) => {
      const blockedStart = moment(blocked.start).tz(vetTimezone);
      const blockedEnd = moment(blocked.end).tz(vetTimezone);
      return utcSlots.some((slot) =>
        moment(slot).isBetween(blockedStart, blockedEnd, null, "[)")
      );
    });

    // Filter available slots
    const availableSlots = slots.filter((slot, index) => {
      const slotTime = slot.utc().toDate();
      return (
        !bookedAppointments.some(
          (appt) => appt.dateTime.getTime() === slotTime.getTime()
        ) &&
        !blockedSlots.some((blocked) =>
          slot.isBetween(moment(blocked.start), moment(blocked.end), null, "[)")
        )
      );
    });

    res.json({
      timezone: vetTimezone,
      slots: availableSlots.map((slot) => slot.format()),
    });
  } catch (error) {
    next(error);
  }
};

// Create new appointment
// controllers/appointmentController.js
exports.createAppointment = async (req, res, next) => {
  try {
    const { veterinarian, pet, dateTime: clientDateTime } = req.body;
    if (!veterinarian || !pet || !clientDateTime) {
      return next(new createError("Missing required fields", 400));
    }

    // Get logged-in user (pet owner)
    const petOwner = req.user._id;

    const vetAvailability = await VetAvailability.findOne({
      vet: veterinarian,
    });
    if (!vetAvailability) {
      return next(new createError("Vet availability not found", 404));
    }

    // Convert client time to vet's timezone
    const slotTime = moment.tz(clientDateTime, vetAvailability.timezone);
    const utcTime = slotTime.utc().toDate();

    // Check if the slot is already booked
    const existingAppointment = await Appointment.findOne({
      veterinarian,
      dateTime: utcTime,
    });

    if (existingAppointment) {
      return next(new createError("This time slot is already booked", 400));
    }

    // Create appointment with proper owner reference
    const appointment = await Appointment.create({
      ...req.body,
      petOwner, // Add the pet owner from authenticated user
      dateTime: utcTime,
    });

    res.status(201).json(appointment);
  } catch (error) {
    next(new createError(error.message, 500));
  }
};

exports.getUserAppointments = async (req, res, next) => {
  try {
    if (req.user.role !== "user") {
      return next(new createError("Access restricted to users only", 403));
    }

    const appointments = await Appointment.find({ petOwner: req.user._id })
      .populate("veterinarian", "name fee") // Include fee in the response
      .sort({ dateTime: 1 });

    res.status(200).json({
      status: "success",
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

exports.getVetStats = async (req, res, next) => {
  try {
    const vetId = req.user._id;

    // Count all appointments regardless of status
    const totalAppointments = await Appointment.countDocuments({
      veterinarian: vetId,
    });

    // Calculate total income from completed appointments only
    const totalIncomeResult = await Appointment.aggregate([
      {
        $match: {
          veterinarian: vetId,
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$payment.amount" },
        },
      },
    ]);

    const totalIncome = totalIncomeResult[0]?.totalIncome || 0;

    res.status(200).json({
      status: "success",
      data: {
        totalAppointments,
        totalIncome,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get vet appointments
exports.getVetAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ veterinarian: req.user._id })
      .populate("petOwner", "name email")
      .sort({ dateTime: 1 });
    res.status(200).json({ status: "success", data: appointments });
  } catch (error) {
    next(error);
  }
};

// Get all vets
exports.getAllVets = async (req, res, next) => {
  try {
    const vets = await User.find({ role: "vet" }).select("name speciality fee");
    if (!vets.length)
      return res
        .status(404)
        .json({ status: "fail", message: "No veterinarians found" });
    res.status(200).json({ status: "success", data: vets });
  } catch (error) {
    next(error);
  }
};

// Confirm appointment
exports.confirmAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      veterinarian: req.user._id,
      status: "pending",
    });

    if (!appointment) {
      return next(
        new createError("Appointment not found or already confirmed", 404)
      );
    }

    // Get vet's timezone
    const vet = await User.findById(req.user._id);
    const vetTimezone = vet?.timezone || "UTC";

    // Format appointment time in vet's timezone
    const formattedDate = moment(appointment.dateTime)
      .tz(vetTimezone)
      .format("MMMM Do YYYY, h:mm a");

    // Add notification to the user
    await User.findByIdAndUpdate(appointment.petOwner, {
      $push: {
        notifications: {
          message: `Your appointment on ${formattedDate} has been confirmed!`,
          type: "appointment",
          read: false,
        },
      },
    });

    // Update appointment status
    appointment.status = "confirmed";
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Error confirming appointment:", error);
    next(new createError("Internal server error", 500));
  }
};

// Complete appointment (vet)
exports.completeAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        veterinarian: req.user._id, // Ensure the vet can only complete their own appointments
        status: "confirmed", // Only confirmed appointments can be completed
      },
      { status: "completed" },
      { new: true }
    );

    if (!appointment) {
      return next(
        new createError("Appointment not found or not confirmed", 404)
      );
    }

    res.status(200).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel appointment (user)
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        petOwner: req.user._id, // Ensure the user can only cancel their own appointments
        status: { $in: ["pending", "confirmed"] }, // Only pending or confirmed appointments can be cancelled
      },
      { status: "cancelled" },
      { new: true }
    );

    if (!appointment) {
      return next(
        new createError("Appointment not found or cannot be cancelled", 404)
      );
    }

    res.status(200).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/// Reschedule appointment (integrated with Create Appointment logic)
exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const { newDateTime } = req.body;
    const appointmentId = req.params.id;

    // Validate newDateTime
    if (!newDateTime) {
      return next(new createError("New date and time are required", 400));
    }

    // Find the appointment
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      petOwner: req.user._id, // Ensure the user owns the appointment
      status: { $in: ["pending", "confirmed"] }, // Only allow rescheduling for pending/confirmed appointments
    });

    if (!appointment) {
      return next(
        new createError("Appointment not found or cannot be rescheduled", 404)
      );
    }

    // Check if the new slot is available
    const vetAvailability = await VetAvailability.findOne({
      vet: appointment.veterinarian,
    });
    const newSlotTime = moment
      .tz(newDateTime, vetAvailability.timezone)
      .utc()
      .toDate();

    // Check if the new slot is already booked or blocked
    const isSlotAvailable = await Appointment.findOne({
      veterinarian: appointment.veterinarian,
      dateTime: newSlotTime,
      _id: { $ne: appointmentId }, // Exclude the current appointment
    });

    if (isSlotAvailable) {
      return next(new createError("The selected slot is not available", 400));
    }

    // Update the appointment
    appointment.dateTime = newSlotTime;
    appointment.status = "pending"; // Reset status to pending for vet confirmation
    await appointment.save();

    res.status(200).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// In your backend (appointmentController.js)

exports.getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch user with notifications
    const user = await User.findById(userId, { notifications: 1 });

    if (!user) {
      return next(new createError("User not found", 404));
    }

    // Sort notifications by createdAt (newest first)
    const notifications = user.notifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      status: "success",
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    next(new createError("Failed to fetch notifications", 500));
  }
};

// Mark notifications as read
exports.markNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Mark all notifications as read
    await User.findByIdAndUpdate(userId, {
      $set: { "notifications.$[].read": true },
    });

    res.status(200).json({
      status: "success",
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    next(new createError("Failed to update notifications", 500));
  }
};

exports.generateSignature = async (req, res, next) => {
  try {
    // Verify authentication
    if (!req.user) {
      return next(new createError("Unauthorized: Please login first", 401));
    }

    const { total_amount, transaction_uuid, product_code } = req.body;

    if (!total_amount || !transaction_uuid || !product_code) {
      return next(new createError("Missing required fields", 400));
    }

    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";

    const hash = CryptoJS.HmacSHA256(message, secretKey);
    const signature = CryptoJS.enc.Base64.stringify(hash);

    res.status(200).json({
      status: "success",
      signature,
    });
  } catch (error) {
    next(new createError(error.message, 500));
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { amount, referenceId, status } = req.query;

    if (status !== "COMPLETE") {
      return res.redirect(`/payment/failure?appointmentId=${appointmentId}`);
    }

    // Verify payment with eSewa API
    const verificationUrl =
      "https://rc-epay.esewa.com.np/api/epay/transaction/status/";
    const verificationParams = {
      product_code: "EPAYTEST",
      total_amount: amount,
      transaction_uuid: referenceId,
    };

    const response = await axios.get(verificationUrl, {
      params: verificationParams,
    });

    if (response.data.status === "COMPLETE") {
      // Update appointment payment status
      await Appointment.findByIdAndUpdate(appointmentId, {
        "payment.status": "paid",
        "payment.transactionId": referenceId,
        "payment.paidAt": new Date(),
        "payment.amount": amount,
      });

      return res.redirect(`/payment/success?appointmentId=${appointmentId}`);
    } else {
      return res.redirect(`/payment/failure?appointmentId=${appointmentId}`);
    }
  } catch (error) {
    next(new createError("Payment verification failed", 500));
  }
};
