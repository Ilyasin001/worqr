import express from "express";
import {createUser, getUsers, getUserById, updateUser, deleteUser } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", protect, adminOnly, getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;