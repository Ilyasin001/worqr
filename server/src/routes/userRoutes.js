import express from "express";
import { getUsers, getUserById, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { createUserValidator, updateUserValidator, validate } from "../validators/userValidator.js";

const router = express.Router();

router.use(protect);

router.post("/", restrictTo('admin'), createUserValidator, validate, createUser);
router.get("/", restrictTo('admin'), getUsers);
router.get("/:id", getUserById);
router.put("/:id", restrictTo('admin'), updateUserValidator, validate, updateUser);
router.delete("/:id", restrictTo('admin'), deleteUser);

export default router;