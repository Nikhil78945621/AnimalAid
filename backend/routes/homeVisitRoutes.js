const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); // Import middleware
const {
  createRequest,
  getVetRequests,
  acceptRequest,
  completeRequest,
  getUserRequests,
} = require("../controllers/homeVisitController");

// Add protect middleware to createRequest route
router.post("/", protect, createRequest);
router.get("/user", protect, getUserRequests);
router.get("/vet", protect, getVetRequests);
router.patch("/:id/accept", protect, acceptRequest);
router.patch("/:id/complete", protect, completeRequest);

module.exports = router;
