const Appointment = require("../models/Appointment");
const VetAvailability = require("../models/VetAvailability");
const createError = require("../utils/appError");
const User = require("../models/userModel");
const moment = require("moment-timezone");

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
    // ... validation

    const vetAvailability = await VetAvailability.findOne({ vet: vetId });
    const vetTimezone = vetAvailability.timezone;

    // Parse input date in vet's timezone
    const inputDate = moment.tz(date, "YYYY-MM-DD", vetTimezone);
    const day = inputDate.format("ddd");

    const workingDay = vetAvailability.workingHours.find(
      (wh) => wh.day === day
    );
    // ... handle no working day

    // Generate time slots in vet's local time
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
    const blockedSlots = vetAvailability.blockedSlots.filter((blocked) =>
      utcSlots.some(
        (slot) =>
          slot >= new Date(blocked.start) && slot < new Date(blocked.end)
      )
    );

    // Filter available slots
    const availableSlots = slots.filter(
      (slot, index) =>
        !bookedAppointments.some(
          (appt) => appt.dateTime.getTime() === utcSlots[index].getTime()
        ) &&
        !blockedSlots.some((blocked) =>
          slot.isBetween(moment(blocked.start), moment(blocked.end))
        )
    );

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

// Confirm appointment (vet)
// controllers/appointmentController.js
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
    const vetAvailability = await VetAvailability.findOne({
      vet: req.user._id,
    });
    const vetTimezone = vetAvailability?.timezone || "UTC";

    // Format appointment time in vet's timezone
    const formattedDate = moment(appointment.dateTime)
      .tz(vetTimezone)
      .format("MMMM Do YYYY, h:mm a");

    // Add notification
    appointment.notifications.push({
      message: `Your appointment on ${formattedDate} has been confirmed!`,
    });

    appointment.status = "confirmed";
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    next(error);
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

exports.blockSlot = async (req, res, next) => {
  try {
    const { start, end, reason } = req.body;
    const vetAvailability = await VetAvailability.findOne({
      vet: req.user._id,
    });

    // Convert to UTC
    const utcStart = moment
      .tz(start, vetAvailability.timezone)
      .utc()
      .toDate();
    const utcEnd = moment
      .tz(end, vetAvailability.timezone)
      .utc()
      .toDate();

    vetAvailability.blockedSlots.push({ start: utcStart, end: utcEnd, reason });
    await vetAvailability.save();

    res.json(vetAvailability);
  } catch (error) {
    next(error);
  }
};
