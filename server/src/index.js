const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const config = require("./config");
const errorHandler = require("./utils/errorHandler");
const AppError = require("./utils/AppError");
const authRoutes = require("./routes/authRoutes");
const oauthRoutes = require("./routes/oauthRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./utils/swagger");

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.CLIENT_URL, credentials: true })); // Restrict CORS to client URL
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Database Connection
mongoose
  .connect(config.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/files", uploadRoutes);
app.use("/api/providers", require("./routes/providerRoutes"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.get("/", (req, res) => {
  res.json({ message: "HelioScape API is running....!!", status: "OK" });
});

// Handle Undefined Routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
});
