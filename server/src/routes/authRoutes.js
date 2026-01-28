import express from "express";
import { login } from "../controllers/authController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { createEvent } from "../controllers/eventController.js";

const router = express.Router();

router.post("/login", login);

router.post("/", protect, adminOnly, createEvent)

export default router;
