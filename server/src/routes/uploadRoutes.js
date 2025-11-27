const express = require("express");
const uploadController = require("../controllers/uploadController");
const authController = require("../controllers/authController");

const router = express.Router();

// Protect all routes
router.use(authController.protect);

router.get("/", uploadController.listFiles);
router.get("/search", uploadController.searchFiles);
router.post("/", uploadController.uploadFile);
router.get("/:id/download", uploadController.downloadFile);
router.delete("/:id", uploadController.deleteFile);
/**
 * @swagger
 * /files/{id}/rename:
 *   patch:
 *     summary: Rename a file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The file ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: The file was renamed
 *       404:
 *         description: File not found
 */
router.patch("/:id/rename", uploadController.renameFile);

/**
 * @swagger
 * /files/{id}/move:
 *   patch:
 *     summary: Move a file to a folder
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The file ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folderId:
 *                 type: string
 *                 description: Target folder ID (null for root)
 *     responses:
 *       200:
 *         description: The file was moved
 *       404:
 *         description: File or target folder not found
 */
router.patch("/:id/move", uploadController.moveFile);

module.exports = router;
