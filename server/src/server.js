import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import cors from "cors";

import userRoutes from "./routes/userRoutes.js";
import shiftRoutes from "./routes/shiftRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import assignmentRoutes from "./routes/assignmentRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT  || 3001;

connectDB();
// Core middleware
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Import routes

app.use("/api/users", userRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/assignments", assignmentRoutes);

// Testing route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Start server - client connection
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
