const Appointment = require("../models/Appointment");
const VetAvailability = require("../models/VetAvailability");
const createError = require("../utils/appError");
const User = require("../models/userModel");

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

    // Validate input
    if (!vetId || !date) {
      return next(new createError("Vet ID and date are required", 400));
    }

    const vetAvailability = await VetAvailability.findOne({ vet: vetId });
    const appointments = await Appointment.find({
      veterinarian: vetId,
      dateTime: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
      },
    });

    if (!vetAvailability) {
      return next(new createError("Vet availability not found", 404));
    }

    const day = new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
    });
    const workingDay = vetAvailability.workingHours.find(
      (wh) => wh.day === day
    );

    if (!workingDay) return res.json([]);

    const start = new Date(`${date}T${workingDay.start}`);
    const end = new Date(`${date}T${workingDay.end}`);
    const allSlots = generateTimeSlots(
      start,
      end,
      vetAvailability.appointmentDuration
    );

    const bookedSlots = appointments.map((a) => a.dateTime.getTime());
    const availableSlots = allSlots.filter(
      (slot) =>
        !bookedSlots.includes(slot.getTime()) &&
        !vetAvailability.blockedSlots.some(
          (blocked) => slot >= blocked.start && slot < blocked.end
        )
    );

    res.status(200).json({
      status: "success",
      data: availableSlots,
    });
  } catch (error) {
    next(error);
  }
};

// Create new appointment
exports.createAppointment = async (req, res, next) => {
  try {
    const { veterinarian, pet, dateTime, notes, address } = req.body;

    if (req.user.role !== "user") {
      return next(new createError("Only users can create appointments", 403));
    }

    const existingAppointment = await Appointment.findOne({
      veterinarian,
      dateTime: new Date(dateTime),
    });

    if (existingAppointment) {
      return next(new createError("Time slot already booked", 400));
    }

    const vet = await User.findById(veterinarian);
    if (!vet || vet.role !== "vet") {
      return next(new createError("Invalid veterinarian", 400));
    }

    const appointment = await Appointment.create({
      petOwner: req.user._id,
      veterinarian,
      pet,
      dateTime,
      notes,
      address,
      payment: {
        amount: vet.fee, // Use the vet's fee
        status: "pending", // Default status
      },
    });

    res.status(201).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    next(error);
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
    const vetId = req.user._id;
    const appointments = await Appointment.find({ veterinarian: vetId })
      .populate("petOwner", "name email")
      .sort({ dateTime: 1 });

    res.status(200).json({
      status: "success",
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllVets = async (req, res, next) => {
  try {
    const vets = await User.find({ role: "vet" }).select("name speciality fee");
    if (!vets.length) {
      return res.status(404).json({
        status: "fail",
        message: "No veterinarians found",
      });
    }

    res.status(200).json({
      status: "success",
      data: vets,
    });
  } catch (error) {
    next(error);
  }
};

// Confirm appointment (vet)
exports.confirmAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        veterinarian: req.user._id, // Ensure the vet can only confirm their own appointments
        status: "pending", // Only pending appointments can be confirmed
      },
      { status: "confirmed" },
      { new: true }
    );

    if (!appointment) {
      return next(
        new createError("Appointment not found or already confirmed", 404)
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

// Reschedule appointment (user)
exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const { newDateTime } = req.body;
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      petOwner: req.user._id, // Ensure the user can only reschedule their own appointments
      status: { $in: ["pending", "confirmed"] }, // Only pending or confirmed appointments can be rescheduled
    });

    if (!appointment) {
      return next(
        new createError("Appointment not found or cannot be rescheduled", 404)
      );
    }

    // Check new time availability
    const vetId = appointment.veterinarian;
    const date = new Date(newDateTime).toISOString().split("T")[0];

    const vetAvailability = await VetAvailability.findOne({ vet: vetId });
    const appointments = await Appointment.find({
      veterinarian: vetId,
      dateTime: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
      },
      _id: { $ne: appointment._id }, // Exclude current appointment
    });

    const day = new Date(newDateTime).toLocaleDateString("en-US", {
      weekday: "short",
    });
    const workingDay = vetAvailability.workingHours.find(
      (wh) => wh.day === day
    );

    if (!workingDay) {
      return next(new createError("Vet not available on this day", 400));
    }

    const slotTime = new Date(newDateTime);
    const start = new Date(`${date}T${workingDay.start}`);
    const end = new Date(`${date}T${workingDay.end}`);

    if (slotTime < start || slotTime >= end) {
      return next(new createError("Selected time outside working hours", 400));
    }

    const existingAppointment = await Appointment.findOne({
      veterinarian: vetId,
      dateTime: newDateTime,
      _id: { $ne: appointment._id },
    });

    if (existingAppointment) {
      return next(new createError("New time slot already booked", 400));
    }

    appointment.dateTime = newDateTime;
    appointment.status = "pending"; // Reset to pending for vet confirmation
    await appointment.save();

    res.status(200).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// Add feedback (user)
exports.addFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        petOwner: req.user._id, // Ensure the user can only add feedback to their own appointments
        status: "completed", // Only completed appointments can have feedback
      },
      { feedback: { rating, comment } },
      { new: true }
    );

    if (!appointment) {
      return next(
        new createError("Appointment not found or not completed", 404)
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
