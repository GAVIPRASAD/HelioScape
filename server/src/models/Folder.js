const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Folder must belong to a user"],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null, // null means root directory
    },
    path: {
      type: String, // e.g., "/Documents/Work" - useful for breadcrumbs/display
      default: "/",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique folder names within the same parent for a user
folderSchema.index({ user: 1, parent: 1, name: 1 }, { unique: true });

const Folder = mongoose.model("Folder", folderSchema);

module.exports = Folder;
