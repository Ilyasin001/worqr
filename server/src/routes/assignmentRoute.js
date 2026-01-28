import express from 'express';
import {createAssignment, getAssignments, getAssignmentById, updateAssignment, deleteAssignment} from '../controllers/assignmentController.js';
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, adminOnly, createAssignment);
router.get("/", protect, adminOnly, getAssignments);
router.get("/:id", getAssignmentById);
router.put("/:id", protect, adminOnly, updateAssignment);
router.delete("/:id", protect, adminOnly, deleteAssignment);

export default router;