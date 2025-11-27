const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router.patch("/updateMe", userController.updateMe);
router.patch("/updateMyPassword", userController.updatePassword);
router.get("/me", authController.getMe); // Moved from authRoutes potentially, or just alias

module.exports = router;
