import express from "express";
import { createEvent, getEvents, getEventbyId, updateEvent, deleteEvent } from "../controllers/eventController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getEvents);
router.get("/:id", getEventbyId);

router.post("/", protect, restrictTo('admin'), createEvent);
router.put("/:id", protect, restrictTo('admin'), updateEvent);
router.delete("/:id", protect, restrictTo('admin'), deleteEvent);

export default router;