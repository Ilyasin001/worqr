import express from "express";
import { createShift, getShifts, getShiftById, updateShift, deleteShift } from "../controllers/shiftController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { createShiftValidator, updateShiftValidator, validate } from "../validators/shiftValidator.js";

const router = express.Router();

router.use(protect);

router.post("/", restrictTo('admin'), createShiftValidator, validate, createShift);
router.get("/", getShifts);
router.get("/:id", getShiftById);
router.put("/:id", restrictTo('admin'), updateShiftValidator, validate, updateShift);
router.delete("/:id", restrictTo('admin'), deleteShift);

export default router;