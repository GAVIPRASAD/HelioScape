const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Database Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/helio";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Basic Route
app.get("/", (req, res) => {
  res.json({ message: "HelioScape API is running....", status: "OK" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
