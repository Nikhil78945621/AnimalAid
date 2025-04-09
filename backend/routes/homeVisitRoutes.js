const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createRequest,
  getVetRequests,
  acceptRequest,
  completeRequest,
  getUserRequests,
  sendChatMessage,
} = require("../controllers/homeVisitController");

router.post("/", protect, createRequest);
router.get("/user", protect, getUserRequests);
router.get("/vet", protect, getVetRequests);
router.patch("/:id/accept", protect, acceptRequest);
router.patch("/:id/complete", protect, completeRequest);
router.post("/send-message", protect, sendChatMessage);

module.exports = router;
