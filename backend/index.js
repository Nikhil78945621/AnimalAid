const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRouter = require("./routes/authRoute");
const appointmentRouter = require("./routes/appointmentRoutes");
const app = express();

// 1) Middlewares
// index.js
app.use(cors());
app.use(express.json());

// 2) Route
app.use("/api/auth", authRouter);
app.use("/api/appointments", appointmentRouter);
// 3) MongoDb connection
mongoose
  .connect("mongodb://localhost:27017/authentication")
  .then(() => console.log("connected to MongoDB!"))
  .catch((error) => console.error("failed to connect to mongoDB:", error));

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
