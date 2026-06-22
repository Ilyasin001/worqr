import express from "express";
import { createEvent, getEvents, getEventbyId, updateEvent, deleteEvent } from "../controllers/eventController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { createEventValidator, updateEventValidator, validate } from "../validators/eventValidator.js";

const router = express.Router();

router.use(protect);

router.get("/", getEvents);
router.get("/:id", getEventbyId);

router.post("/", restrictTo('admin'), createEventValidator, validate, createEvent);
router.put("/:id", restrictTo('admin'), updateEventValidator, validate, updateEvent);
router.delete("/:id", restrictTo('admin'), deleteEvent);

export default router;
