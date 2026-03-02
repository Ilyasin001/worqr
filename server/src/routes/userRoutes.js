import express from "express";
import { getUsers, getUserById, updateUser, deleteUser } from "../controllers/userController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", restrictTo('admin'), getUsers);  
router.get("/:id", getUserById); 
router.put("/:id", updateUser);
router.delete("/:id", restrictTo('admin'), deleteUser);

export default router;