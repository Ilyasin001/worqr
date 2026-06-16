import express from "express";
import { createAssignment, getAssignments, getAssignmentById, updateAssignment, deleteAssignment } from "../controllers/assignmentController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { createAssignmentValidator, updateAssignmentValidator, validate } from "../validators/assignmentValidator.js";

const router = express.Router();

router.use(protect);

router.post("/", restrictTo('admin'), createAssignmentValidator, validate, createAssignment);
router.get("/", getAssignments);
router.get("/:id", getAssignmentById);
router.put("/:id", restrictTo('admin'), updateAssignmentValidator, validate, updateAssignment);
router.delete("/:id", restrictTo('admin'), deleteAssignment);

export default router;