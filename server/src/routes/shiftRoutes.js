import express from "express";
import { createShift, getShifts, getShiftById, getOpenShifts, claimShift, updateShift, deleteShift } from "../controllers/shiftController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { createShiftValidator, updateShiftValidator, validate } from "../validators/shiftValidator.js";

const router = express.Router();

router.use(protect);

router.post("/", restrictTo('admin'), createShiftValidator, validate, createShift);
router.get("/", getShifts);
// Self-service: list claimable shifts, and claim one. Declared before "/:id".
router.get("/open", getOpenShifts);
router.post("/:id/claim", claimShift);
router.get("/:id", getShiftById);
router.put("/:id", restrictTo('admin'), updateShiftValidator, validate, updateShift);
router.delete("/:id", restrictTo('admin'), deleteShift);

export default router;
