const express = require("express");
const uploadController = require("../controllers/uploadController");
const authController = require("../controllers/authController");

const router = express.Router();

// Protect all routes
router.use(authController.protect);

/**
 * @swagger
 * /files:
 *   get:
 *     summary: List all files
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: folderId
 *         schema:
 *           type: string
 *         description: Filter by folder ID
 *     responses:
 *       200:
 *         description: List of files
 *   post:
 *     summary: Upload a new file
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folderId:
 *                 type: string
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *
 * /files/media:
 *   get:
 *     summary: List media files (images, videos)
 *     tags: [Files]
 *     responses:
 *       200:
 *         description: List of media files
 *
 * /files/search:
 *   get:
 *     summary: Search for files
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *
 * /files/stats:
 *   get:
 *     summary: Get storage statistics
 *     tags: [Files]
 *     responses:
 *       200:
 *         description: Storage usage stats
 *
 * /files/{id}:
 *   get:
 *     summary: Get file metadata
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File metadata
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: File deleted
 *
 * /files/{id}/download:
 *   get:
 *     summary: Download a file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File stream
 */
router.get("/", uploadController.listFiles);
router.get("/media", uploadController.listMedia);
router.get("/search", uploadController.searchFiles);
router.post("/", uploadController.uploadFile);
router.get("/stats", uploadController.getStorageStats);
router.get("/:id", uploadController.getFile);
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
