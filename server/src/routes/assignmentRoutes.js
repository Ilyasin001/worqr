import express from 'express';
import {createAssignment, getAssignments, getAssignmentById, updateAssignment, deleteAssignment} from '../controllers/assignmentController.js';
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.post("/", createAssignment);
router.get("/", getAssignments);
router.get("/:id", getAssignmentById);
router.put("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);

export default router;