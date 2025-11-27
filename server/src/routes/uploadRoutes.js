const express = require("express");
const uploadController = require("../controllers/uploadController");
const authController = require("../controllers/authController");

const router = express.Router();

// Protect all routes
router.use(authController.protect);

router.get("/", uploadController.listFiles);
router.post("/", uploadController.uploadFile);
router.get("/:id/download", uploadController.downloadFile);
router.delete("/:id", uploadController.deleteFile);

module.exports = router;
