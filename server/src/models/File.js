const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  encryption: {
    algorithm: { type: String, default: "aes-256-gcm" },
    key: { type: String, select: false }, // Encrypted key (future) - for now we might store it or derive it
    iv: { type: String }, // Initial IV if needed, though CipherStream prepends it
  },
  chunks: [
    {
      index: Number,
      provider: String, // 'google', 'dropbox', etc.
      providerFileId: String,
      size: Number,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("File", FileSchema);
