const express = require("express");
const VetAvailability = require("../models/VetAvailability");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Block a slot
router.post("/block-slot", protect, async (req, res) => {
  try {
    const { start, end, reason } = req.body;
    const vetId = req.user._id;

    const vetAvailability = await VetAvailability.findOne({ vet: vetId });
    if (!vetAvailability) {
      return res.status(404).json({ message: "Vet availability not found" });
    }

    vetAvailability.blockedSlots.push({ start, end, reason });
    await vetAvailability.save();

    res.status(200).json(vetAvailability);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error blocking slot", error: error.message });
  }
});

// Get vet availability
router.get("/availability", protect, async (req, res) => {
  try {
    const vetId = req.user._id;
    const vetAvailability = await VetAvailability.findOne({ vet: vetId });

    if (!vetAvailability) {
      return res.status(404).json({ message: "Vet availability not found" });
    }

    res.status(200).json(vetAvailability);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching availability", error: error.message });
  }
});

// Update vet availability
router.put("/availability", protect, async (req, res) => {
  try {
    const vetId = req.user._id;
    const { workingHours, appointmentDuration, timezone } = req.body;

    const vetAvailability = await VetAvailability.findOneAndUpdate(
      { vet: vetId },
      { workingHours, appointmentDuration, timezone },
      { new: true, upsert: true }
    );

    res.status(200).json(vetAvailability);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating availability", error: error.message });
  }
});

module.exports = router;
