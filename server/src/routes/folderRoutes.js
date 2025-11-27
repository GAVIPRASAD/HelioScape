const express = require("express");
const folderController = require("../controllers/folderController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

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
