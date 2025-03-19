const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const authRouter = require("./routes/authRoute");
const appointmentRouter = require("./routes/appointmentRoutes");
const vetRoutes = require("./routes/VetRoutes");
const homeVisitRoutes = require("./routes/homeVisitRoutes");
const serviceRoutes = require("./routes/serviceRoutes");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend origin
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Routes
app.use("/api/auth", authRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/vet", vetRoutes);
app.use("/api/home-visits", homeVisitRoutes);
app.use("/api/services", serviceRoutes);

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/authentication", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB!"))
  .catch((error) => console.error("Failed to connect to MongoDB:", error));

// Global Error Handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

// Server
const PORT = 8084;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
