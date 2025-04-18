const express = require("express");
const router = express.Router();
const vetApplicationController = require("../controllers/vetApplicationController");
const { protect } = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

// Submit application (user only)
router.post(
  "/submit",
  protect,
  checkRole("user"),
  vetApplicationController.submitVetApplication
);

// Get pending applications (admin only)
router.get(
  "/pending",
  protect,
  checkRole("admin"),
  vetApplicationController.getPendingApplications
);

// Review application (admin only)
router.patch(
  "/review",
  protect,
  checkRole("admin"),
  vetApplicationController.reviewApplication
);

module.exports = router;
