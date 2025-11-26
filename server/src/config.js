require("dotenv").config();

module.exports = {
  PORT: process.env.SERVER_PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/helio",
  JWT_SECRET: process.env.JWT_SECRET || "default_secret",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    CALLBACK_URL: "/auth/google/callback",
  },

  DROPBOX: {
    CLIENT_ID: process.env.DROPBOX_CLIENT_ID,
    CLIENT_SECRET: process.env.DROPBOX_CLIENT_SECRET,
  },
};
