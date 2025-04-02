const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

// Apply auth middleware to all admin routes
router.use(protect);
router.use(checkRole("admin"));

// Dashboard route
router.get("/dashboard", adminController.getAdminDashboard);

// User management routes
router.get("/users", adminController.getAllUsers);
router.patch("/users/:userId/role", adminController.updateUserRole);
router.delete("/users/:userId", adminController.deleteUser);

module.exports = router;
