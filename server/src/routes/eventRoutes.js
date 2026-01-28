import express from "express";
import { createEvent, getEvents, getEventbyId, updateEvent, deleteEvent } from "../controllers/eventController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.post("/", createEvent);
router.get("/", getEvents);
router.get("/:id", getEventbyId);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

export default router;