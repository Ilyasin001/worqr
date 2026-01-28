import express from 'express';
import {createShift, getShifts, getShiftById, updateShift, deleteShift} from '../controllers/shiftController.js';
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, adminOnly, createShift);
router.get("/", protect, adminOnly, getShifts);
router.get("/:id", getShiftById);
router.put("/:id", protect, adminOnly, updateShift);
router.delete("/:id", protect, adminOnly, deleteShift);

export default router;