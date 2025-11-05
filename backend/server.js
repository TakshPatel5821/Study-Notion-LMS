// ----------------------------
// StudyNotion Backend Server
// ----------------------------

const express = require("express");
const app = express();

// ----------------------------
// Package Imports
// ----------------------------
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

// ----------------------------
// Database and Cloudinary Connection
// ----------------------------
const { connectDB } = require("./config/database");
const { cloudinaryConnect } = require("./config/cloudinary");

// ----------------------------
// Route Imports
// ----------------------------
const userRoutes = require("./routes/user");
const profileRoutes = require("./routes/profile");
const paymentRoutes = require("./routes/payments");
const courseRoutes = require("./routes/course");

// ----------------------------
// Middleware
// ----------------------------
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser());
app.use(
    cors({
        // In production, change this to your actual frontend domain
        origin: "*",
        credentials: true,
    })
);
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp",
    })
);

// ----------------------------
// Connect to DB and Cloudinary
// ----------------------------
connectDB();
cloudinaryConnect();

// ----------------------------
// Mount Routes
// ----------------------------
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/course", courseRoutes);

// ----------------------------
// Default Route
// ----------------------------
app.get("/", (req, res) => {
    res.send(`
    <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
      <h2>✅ StudyNotion Backend is Running</h2>
      <p>Everything is OK 🚀</p>
    </div>
  `);
});

// ----------------------------
// Global Error Handling Middleware
// ----------------------------
app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err.message);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
});

// ----------------------------
// Start the Server
// ----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server started on PORT ${PORT}`);
});
