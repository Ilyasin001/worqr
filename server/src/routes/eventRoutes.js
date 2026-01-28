import express from "express";
import { createEvent, getEvents, getEventbyId, updateEvent, deleteEvent } from "../controllers/eventController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, adminOnly, createEvent);
router.get("/", getEvents);
router.get("/:id", getEventbyId);
router.put("/:id", protect, adminOnly, updateEvent);
router.delete("/:id", protect, adminOnly, deleteEvent);

export default router;