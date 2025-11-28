const express = require("express");
const oauthController = require("../controllers/oauthController");
const { protect } = require("../controllers/authController");

const router = express.Router();

// Initiate OAuth flow for a specific provider
// GET /api/oauth/:provider (e.g., /api/oauth/google)
/**
 * @swagger
 * /oauth/{provider}:
 *   get:
 *     summary: Initiate OAuth flow
 *     tags: [OAuth]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, dropbox, onedrive]
 *     responses:
 *       302:
 *         description: Redirects to provider login
 */
router.get("/:provider", protect, oauthController.initiateAuth);

/**
 * @swagger
 * /oauth/{provider}/callback:
 *   get:
 *     summary: OAuth callback handler
 *     tags: [OAuth]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 */
router.get("/:provider/callback", oauthController.handleCallback);

/**
 * @swagger
 * /oauth/mega/login:
 *   post:
 *     summary: Link MEGA account
 *     tags: [OAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: MEGA account linked
 */
router.post("/mega/login", protect, oauthController.megaLogin);

/**
 * @swagger
 * /oauth/{provider}/link:
 *   post:
 *     summary: Link an OAuth provider (Client-side flow)
 *     tags: [OAuth]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               redirectUri:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account linked
 */
router.post("/:provider/link", protect, oauthController.linkAccount);

/**
 * @swagger
 * /oauth/{provider}/{providerId}:
 *   delete:
 *     summary: Unlink a cloud provider
 *     tags: [OAuth]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Provider unlinked
 */
router.delete(
  "/:provider/:providerId",
  protect,
  oauthController.unlinkProvider
);

module.exports = router;
