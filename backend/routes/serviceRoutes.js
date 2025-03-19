const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, serviceController.createServiceDetail); // POST /api/services
router.get("/:serviceType", serviceController.getServiceDetails); // GET /api/services/:serviceType
router.put("/:id", protect, serviceController.updateServiceDetail); // PUT /api/services/:id
router.delete("/:id", protect, serviceController.deleteServiceDetail); // DELETE /api/services/:id

module.exports = router;
