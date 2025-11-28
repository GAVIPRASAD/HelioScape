const express = require("express");
const folderController = require("../controllers/folderController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

/**
 * @swagger
 * /folders:
 *   get:
 *     summary: Get all folders in the current directory
 *     tags: [Folders]
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: The ID of the parent folder (optional, defaults to root)
 *     responses:
 *       200:
 *         description: List of folders
 *   post:
 *     summary: Create a new folder
 *     tags: [Folders]
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
 *               parentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Folder created
 *
 * /folders/{id}:
 *   get:
 *     summary: Get a specific folder by ID
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder details
 *       404:
 *         description: Folder not found
 *   delete:
 *     summary: Delete a folder and its contents
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Folder deleted
 *       404:
 *         description: Folder not found
 */
router
  .route("/")
  .get(folderController.getFolders)
  .post(folderController.createFolder);

router
  .route("/:id")
  .get(folderController.getFolder)
  .delete(folderController.deleteFolder);
/**
 * @swagger
 * /folders/{id}/rename:
 *   patch:
 *     summary: Rename a folder
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The folder ID
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
 *         description: The folder was renamed
 *       404:
 *         description: Folder not found
 */
router.patch("/:id/rename", folderController.renameFolder);

/**
 * @swagger
 * /folders/{id}/move:
 *   patch:
 *     summary: Move a folder
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The folder ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parentId:
 *                 type: string
 *                 description: Target parent folder ID (null for root)
 *     responses:
 *       200:
 *         description: The folder was moved
 *       400:
 *         description: Invalid move (e.g. into itself)
 *       404:
 *         description: Folder or target parent not found
 */
router.patch("/:id/move", folderController.moveFolder);

module.exports = router;
