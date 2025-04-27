const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get("/profile", protect, authController.getProfile);
router.patch("/profile", protect, authController.updateProfile);

module.exports = router;
