const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRouter = require("./routes/authRoute");
const appointmentRouter = require("./routes/appointmentRoutes");
const vetRoutes = require("./routes/VetRoutes"); // Ensure correct file path

const app = express();

// 1) Middlewares
app.use(cors());
app.use(express.json());

// 2) Routes
app.use("/api/auth", authRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/vet", vetRoutes); // Added vet routes

// 3) MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/authentication", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB!"))
  .catch((error) => console.error("Failed to connect to MongoDB:", error));

// 4) Global Error Handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

// 5) Server
const PORT = 8084;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
