import express from "express";
import { login, register } from "../controllers/authController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);

router.post("/register", protect, adminOnly, register);

export default router;
