import express from "express";
import { createShift, getShifts, getShiftById, updateShift, deleteShift } from "../controllers/shiftController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrictTo('admin'), createShift);
router.get("/", getShifts); 
router.get("/:id", getShiftById);
router.put("/:id", restrictTo('admin'), updateShift);
router.delete("/:id", restrictTo('admin'), deleteShift);

export default router;