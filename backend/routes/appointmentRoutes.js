const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { protect } = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

// Public route
router.get("/available", appointmentController.getAvailableSlots);

// Protected routes
router.use(protect);

// User routes
router.post("/", checkRole("user"), appointmentController.createAppointment);

router.get(
  "/user",
  protect,
  checkRole("user"),
  appointmentController.getUserAppointments
);

router.patch(
  "/:id/cancel",
  checkRole("user"),
  appointmentController.cancelAppointment
);
router.patch(
  "/:id/reschedule",
  protect,
  checkRole("user"),
  appointmentController.rescheduleAppointment
);

// router.patch(
//   "/:id/feedback",
//   checkRole("user"),
//   appointmentController.addFeedback
// );

// Vet routes
router.get(
  "/vet",
  protect,
  checkRole("vet"),
  appointmentController.getVetAppointments
);
router.patch(
  "/:id/confirm",
  checkRole("vet"),
  appointmentController.confirmAppointment
);
router.patch(
  "/:id/complete",
  checkRole("vet"),
  appointmentController.completeAppointment
);

router.get("/vets", checkRole("user"), appointmentController.getAllVets);
router.get(
  "/vet/stats",
  protect,
  checkRole("vet"),
  appointmentController.getVetStats
);

router.get(
  "/notifications",
  protect,
  appointmentController.getUserNotifications
);

router.get(
  "/notifications/mark-read",
  protect,
  appointmentController.markNotificationsAsRead
);

router.post(
  "/payment/generate-signature",
  protect,
  appointmentController.generateSignature
);
router.get(
  "/payment/verify/:appointmentId",
  appointmentController.verifyPayment
);

router.get("/vets/search", appointmentController.searchVets);

module.exports = router;
