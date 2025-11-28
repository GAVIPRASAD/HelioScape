const express = require("express");
const providerController = require("../controllers/providerController");
const { protect } = require("../controllers/authController");

const router = express.Router();

// Protect all routes
router.use(protect);

/**
 * @swagger
 * /providers/quota:
 *   get:
 *     summary: Get storage quota across all providers
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Storage quota details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 used:
 *                   type: number
 *                 providers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       total:
 *                         type: number
 *                       used:
 *                         type: number
 */
router.get("/quota", providerController.getQuota);

module.exports = router;
