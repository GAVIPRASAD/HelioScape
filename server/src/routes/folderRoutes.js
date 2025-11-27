const express = require("express");
const folderController = require("../controllers/folderController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(folderController.getFolders)
  .post(folderController.createFolder);

router.route("/:id").delete(folderController.deleteFolder);

module.exports = router;
