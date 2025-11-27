const Folder = require("../models/Folder");
const File = require("../models/File");
const AppError = require("../utils/AppError");

exports.createFolder = async (req, res, next) => {
  try {
    const { name, parentId } = req.body;

    // Check if parent exists if provided
    let parentFolder = null;
    let path = "/";

    if (parentId) {
      parentFolder = await Folder.findOne({
        _id: parentId,
        user: req.user._id,
      });
      if (!parentFolder) {
        return next(new AppError("Parent folder not found", 404));
      }
      path = `${parentFolder.path}${parentFolder.name}/`;
    }

    const newFolder = await Folder.create({
      name,
      user: req.user._id,
      parent: parentId || null,
      path,
    });

    res.status(201).json({
      status: "success",
      data: {
        folder: newFolder,
      },
    });
  } catch (err) {
    // Handle duplicate name error
    if (err.code === 11000) {
      return next(
        new AppError(
          "A folder with this name already exists in this location",
          400
        )
      );
    }
    next(err);
  }
};

exports.getFolders = async (req, res, next) => {
  try {
    const { parentId } = req.query;
    const query = { user: req.user._id, parent: parentId || null };

    const folders = await Folder.find(query).sort({ name: 1 });

    res.status(200).json({
      status: "success",
      results: folders.length,
      data: {
        folders,
      },
    });
  } catch (err) {
    next(err);
  }
};

const FileService = require("../services/FileService");

// ...

exports.deleteFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({ _id: id, user: req.user._id });

    if (!folder) {
      return next(new AppError("Folder not found", 404));
    }

    // Recursive function to get all descendant folder IDs
    const getDescendantFolderIds = async (folderId) => {
      const children = await Folder.find({ parent: folderId });
      let ids = children.map((child) => child._id);
      for (const child of children) {
        const grandChildrenIds = await getDescendantFolderIds(child._id);
        ids = [...ids, ...grandChildrenIds];
      }
      return ids;
    };

    const foldersToDelete = [folder._id, ...(await getDescendantFolderIds(id))];

    // Find all files in these folders
    const filesToDelete = await File.find({
      folder: { $in: foldersToDelete },
      user: req.user._id,
    });

    console.log(
      `[DeleteFolder] Deleting ${foldersToDelete.length} folders and ${filesToDelete.length} files.`
    );

    // Delete all files
    await Promise.all(
      filesToDelete.map((file) => FileService.deleteFile(file._id, req.user))
    );

    // Delete all folders
    await Folder.deleteMany({
      _id: { $in: foldersToDelete },
      user: req.user._id,
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Renames a folder.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.renameFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return next(new AppError("New name is required", 400));
    }

    const folder = await Folder.findOne({ _id: id, user: req.user._id });

    if (!folder) {
      return next(new AppError("Folder not found", 404));
    }

    folder.name = name;
    await folder.save();

    res.status(200).json({
      status: "success",
      data: { folder },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Moves a folder to a different parent folder.
 * Handles recursive path updates and prevents circular moves.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.moveFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;

    // Prevent moving folder into itself
    if (id === parentId) {
      return next(new AppError("Cannot move folder into itself", 400));
    }

    const folder = await Folder.findOne({ _id: id, user: req.user._id });

    if (!folder) {
      return next(new AppError("Folder not found", 404));
    }

    // Verify target parent exists if not root
    let newPath = "/";
    if (parentId) {
      const parentFolder = await Folder.findOne({
        _id: parentId,
        user: req.user._id,
      });
      if (!parentFolder) {
        return next(new AppError("Target parent folder not found", 404));
      }
      // Check for circular dependency (moving parent into child)
      if (parentFolder.path.includes(`/${folder.name}/`)) {
        return next(new AppError("Cannot move folder into its own child", 400));
      }

      newPath = `${parentFolder.path}${parentFolder.name}/`;
    }

    folder.parent = parentId || null;
    folder.path = newPath;
    await folder.save();

    // Recursive path update for children
    const updateChildrenPaths = async (parentFolder) => {
      const children = await Folder.find({ parent: parentFolder._id });
      for (const child of children) {
        child.path = `${parentFolder.path}${parentFolder.name}/`;
        await child.save();
        await updateChildrenPaths(child);
      }
    };

    await updateChildrenPaths(folder);

    res.status(200).json({
      status: "success",
      data: { folder },
    });
  } catch (err) {
    next(err);
  }
};
