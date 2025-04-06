const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { protect } = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

// Vet routes
router.post("/", protect, serviceController.createServiceDetail);
router.put("/:id", protect, serviceController.updateServiceDetail);
router.delete("/:id", protect, serviceController.deleteServiceDetail);

// Public routes
router.get("/:serviceType", serviceController.getServiceDetails);

// Admin routes
router.get(
  "/admin/pending",
  protect,
  checkRole("admin"),
  serviceController.getPendingApprovals
);
router.patch(
  "/admin/:id/approve",
  protect,
  checkRole("admin"),
  serviceController.approveServiceDetail
);
router.patch(
  "/admin/:id/reject",
  protect,
  checkRole("admin"),
  serviceController.rejectServiceDetail
);

module.exports = router;
