const express = require("express");
const oauthController = require("../controllers/oauthController");
const { protect } = require("../controllers/authController");

const router = express.Router();

// Initiate OAuth flow for a specific provider
// GET /api/oauth/:provider (e.g., /api/oauth/google)
router.get("/:provider", protect, oauthController.initiateAuth);

// Handle OAuth callback (Server-side)
// GET /api/oauth/:provider/callback
router.get("/:provider/callback", oauthController.handleCallback);

// Link a provider (Client-side flow)
// POST /api/oauth/:provider/link
router.post("/:provider/link", protect, oauthController.linkAccount);

// Unlink a provider
// Unlink a specific account
// DELETE /api/oauth/:provider/:providerId
router.delete(
  "/:provider/:providerId",
  protect,
  oauthController.unlinkProvider
);

module.exports = router;
