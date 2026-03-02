import express from "express";
import { createAssignment, getAssignments, getAssignmentById, updateAssignment, deleteAssignment } from "../controllers/assignmentController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrictTo('admin'), createAssignment);
router.get("/", getAssignments);
router.get("/:id", getAssignmentById);
router.put("/:id", restrictTo('admin'), updateAssignment);
router.delete("/:id", restrictTo('admin'), deleteAssignment);

export default router;