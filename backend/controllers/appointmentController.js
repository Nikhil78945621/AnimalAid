// controllers/appointmentController.js
const Appointment = require("../models/Appointment");
const VetAvailability = require("../models/VetAvailability");
const createError = require("../utils/appError");
const User = require("../models/userModel");
const moment = require("moment-timezone");
const axios = require("axios");

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

exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { vetId, date } = req.query;
    const vetAvailability = await VetAvailability.findOne({ vet: vetId });
    if (!vetAvailability) {
      return next(new createError("Vet availability not found", 404));
    }

    const vetTimezone = vetAvailability.timezone;
    const inputDate = moment.tz(date, "YYYY-MM-DD", vetTimezone);
    const day = inputDate.format("ddd");

    const workingDay = vetAvailability.workingHours.find(
      (wh) => wh.day === day
    );
    if (!workingDay || !workingDay.active) {
      return res.json({ timezone: vetTimezone, slots: [] });
    }

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

    const utcSlots = slots.map((slot) => slot.utc().toDate());
    const bookedAppointments = await Appointment.find({
      veterinarian: vetId,
      dateTime: { $in: utcSlots },
    });

    const blockedSlots = vetAvailability.blockedSlots.filter((blocked) => {
      const blockedStart = moment(blocked.start).tz(vetTimezone);
      const blockedEnd = moment(blocked.end).tz(vetTimezone);
      return utcSlots.some((slot) =>
        moment(slot).isBetween(blockedStart, blockedEnd, null, "[)")
      );
    });

    const availableSlots = slots.filter((slot) => {
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

exports.createAppointment = async (req, res, next) => {
  try {
    const { veterinarian, pet, dateTime: clientDateTime } = req.body;
    if (!veterinarian || !pet || !clientDateTime) {
      return next(new createError("Missing required fields", 400));
    }

    const petOwner = req.user._id;
    const vetAvailability = await VetAvailability.findOne({
      vet: veterinarian,
    });
    if (!vetAvailability) {
      return next(new createError("Vet availability not found", 404));
    }

    const slotTime = moment.tz(clientDateTime, vetAvailability.timezone);
    const utcTime = slotTime.utc().toDate();

    const existingAppointment = await Appointment.findOne({
      veterinarian,
      dateTime: utcTime,
    });

    if (existingAppointment) {
      return next(new createError("This time slot is already booked", 400));
    }

    const appointment = await Appointment.create({
      ...req.body,
      petOwner,
      dateTime: utcTime,
      payment: { amount: 0, status: "pending" }, // Initialize payment field
    });

    const vet = await User.findById(veterinarian);
    if (!vet) {
      return next(new createError("Veterinarian not found", 404));
    }

    const formattedDate = moment(utcTime)
      .tz(vet.timezone || "UTC")
      .format("MMMM Do YYYY, h:mm a");

    await User.findByIdAndUpdate(veterinarian, {
      $push: {
        notifications: {
          message: `New appointment booked for ${formattedDate} with pet "${pet}".`,
          type: "appointment",
          read: false,
          createdAt: new Date(),
        },
      },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error("Create appointment error:", error);
    next(
      new createError(`Failed to create appointment: ${error.message}`, 500)
    );
  }
};

exports.getUserAppointments = async (req, res, next) => {
  try {
    if (req.user.role !== "user") {
      return next(new createError("Access restricted to users only", 403));
    }

    const appointments = await Appointment.find({ petOwner: req.user._id })
      .populate("veterinarian", "name fee")
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
    const totalAppointments = await Appointment.countDocuments({
      veterinarian: vetId,
    });

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

exports.getAllVets = async (req, res, next) => {
  try {
    const vets = await User.find({ role: "vet" }).select("name speciality fee");
    if (!vets.length) {
      return res
        .status(404)
        .json({ status: "fail", message: "No veterinarians found" });
    }
    res.status(200).json({ status: "success", data: vets });
  } catch (error) {
    next(error);
  }
};

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

    const vet = await User.findById(req.user._id);
    const vetTimezone = vet?.timezone || "UTC";

    const formattedDate = moment(appointment.dateTime)
      .tz(vetTimezone)
      .format("MMMM Do YYYY, h:mm a");

    await User.findByIdAndUpdate(appointment.petOwner, {
      $push: {
        notifications: {
          message: `Your appointment on ${formattedDate} has been confirmed!`,
          type: "appointment",
          read: false,
        },
      },
    });

    appointment.status = "confirmed";
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Error confirming appointment:", error);
    next(new createError("Internal server error", 500));
  }
};

exports.completeAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        veterinarian: req.user._id,
        status: "confirmed",
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

exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        petOwner: req.user._id,
        status: { $in: ["pending", "confirmed"] },
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

exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const { newDateTime } = req.body;
    const appointmentId = req.params.id;

    if (!newDateTime) {
      return next(new createError("New date and time are required", 400));
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      petOwner: req.user._id,
      status: { $in: ["pending", "confirmed"] },
    });

    if (!appointment) {
      return next(
        new createError("Appointment not found or cannot be rescheduled", 404)
      );
    }

    const vetAvailability = await VetAvailability.findOne({
      vet: appointment.veterinarian,
    });
    const newSlotTime = moment
      .tz(newDateTime, vetAvailability.timezone)
      .utc()
      .toDate();

    const isSlotAvailable = await Appointment.findOne({
      veterinarian: appointment.veterinarian,
      dateTime: newSlotTime,
      _id: { $ne: appointmentId },
    });

    if (isSlotAvailable) {
      return next(new createError("The selected slot is not available", 400));
    }

    appointment.dateTime = newSlotTime;
    appointment.status = "pending";
    await appointment.save();

    res.status(200).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId, { notifications: 1 });

    if (!user) {
      return next(new createError("User not found", 404));
    }

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

exports.markNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
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

exports.searchVets = async (req, res, next) => {
  try {
    const { name } = req.query;
    const searchQuery = name
      ? { name: { $regex: new RegExp(name, "i") }, role: "vet" }
      : { role: "vet" };

    const vets = await User.find(searchQuery).select("name speciality fee");

    res.status(200).json({
      status: "success",
      results: vets.length,
      data: vets,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelVetAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      veterinarian: req.user._id,
      status: { $in: ["pending", "confirmed"] },
    });

    if (!appointment) {
      return next(
        new createError("Appointment not found or cannot be cancelled", 404)
      );
    }

    const vet = await User.findById(req.user._id);
    const vetTimezone = vet?.timezone || "UTC";

    const formattedDate = moment(appointment.dateTime)
      .tz(vetTimezone)
      .format("MMMM Do YYYY, h:mm a");

    await User.findByIdAndUpdate(appointment.petOwner, {
      $push: {
        notifications: {
          message: `Your appointment on ${formattedDate} has been cancelled by Veterinarian ${vet.name}.`,
          type: "appointment",
          read: false,
          createdAt: new Date(),
        },
      },
    });

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    next(new createError("Failed to cancel appointment", 500));
  }
};

exports.initiateKhaltiPayment = async (req, res, next) => {
  try {
    const { appointmentId, amount } = req.body;

    if (!appointmentId || !amount) {
      return next(
        new createError("Please provide both appointmentId and amount", 400)
      );
    }

    // Verify appointment exists and belongs to the user
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return next(new createError("Appointment not found", 404));
    }
    if (appointment.petOwner.toString() !== req.user._id.toString()) {
      return next(
        new createError("Unauthorized: You do not own this appointment", 403)
      );
    }

    const paymentPayload = {
      return_url: `http://localhost:3000/payment/success?appointmentId=${appointmentId}`,
      purchase_order_id: appointmentId,
      purchase_order_name: "Veterinary Appointment",
      amount: amount * 100,
      website_url: "http://localhost:3000",
      customer_info: {
        name: req.user.name || "Customer",
        email: req.user.email || "customer@example.com",
        phone: "9800000000",
      },
    };

    console.log("Khalti payment payload:", paymentPayload);

    const response = await axios.post(
      "https://a.khalti.com/api/v2/epayment/initiate/",
      paymentPayload,
      {
        headers: {
          Authorization: `key ${process.env.KHALTI_SECRET_KEY ||
            "3fb3d001f89c4fd7965e13ed9f96c6eb"}`,
        },
      }
    );

    console.log("Khalti initiate response:", response.data);

    res.status(200).json({
      status: "success",
      data: response.data,
    });
  } catch (error) {
    console.error("Khalti Payment Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    next(new createError("Failed to initiate payment", 500));
  }
};

exports.verifyKhaltiPayment = async (req, res, next) => {
  try {
    const { appointmentId, pidx } = req.query;

    if (!appointmentId || !pidx) {
      return res.redirect(`/payment/failure?appointmentId=${appointmentId}`);
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      console.error("Appointment not found:", appointmentId);
      return res.redirect(`/payment/failure?appointmentId=${appointmentId}`);
    }
    if (appointment.petOwner.toString() !== req.user?._id.toString()) {
      console.error("Unauthorized access for appointment:", appointmentId);
      return next(
        new createError("Unauthorized: You do not own this appointment", 403)
      );
    }

    console.log("Verifying Khalti payment for:", { appointmentId, pidx });

    const response = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization: `key ${process.env.KHALTI_SECRET_KEY ||
            "3fb3d001f89c4fd7965e13ed9f96c6eb"}`,
        },
      }
    );

    console.log("Khalti verification response:", response.data);

    if (response.data.status === "Completed") {
      console.log("Before payment update:", appointment.payment);

      const updatedAppointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        {
          $set: {
            "payment.status": "paid",
            "payment.transactionId": pidx,
            "payment.paidAt": new Date(),
            "payment.amount": response.data.total_amount / 100,
          },
        },
        { new: true }
      );

      console.log("After payment update:", updatedAppointment.payment);

      return res.redirect(`/payment/success?appointmentId=${appointmentId}`);
    } else {
      console.log("Payment not completed:", response.data.status);
      return res.redirect(`/payment/failure?appointmentId=${appointmentId}`);
    }
  } catch (error) {
    console.error("Khalti Verification Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    next(new createError("Payment verification failed", 500));
  }
};
