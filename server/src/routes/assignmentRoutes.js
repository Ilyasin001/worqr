import express from "express";
import { createAssignment, getAssignments, getAssignmentById, updateAssignment, updateAssignmentStatus, deleteAssignment } from "../controllers/assignmentController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { createAssignmentValidator, updateAssignmentValidator, updateAssignmentStatusValidator, validate } from "../validators/assignmentValidator.js";

const router = express.Router();

router.use(protect);

router.post("/", restrictTo('admin'), createAssignmentValidator, validate, createAssignment);
router.get("/", getAssignments);
router.get("/:id", getAssignmentById);
// Status changes are open to any member; the controller enforces that staff
// may only confirm/decline their own assignment.
router.patch("/:id/status", updateAssignmentStatusValidator, validate, updateAssignmentStatus);
router.put("/:id", restrictTo('admin'), updateAssignmentValidator, validate, updateAssignment);
router.delete("/:id", restrictTo('admin'), deleteAssignment);

export default router;
