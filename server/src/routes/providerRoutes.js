const express = require("express");
const providerController = require("../controllers/providerController");
const { protect } = require("../controllers/authController");

const router = express.Router();

// Protect all routes
router.use(protect);

router.get("/quota", providerController.getQuota);

module.exports = router;
