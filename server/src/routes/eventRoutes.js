import express from "express";

import { createEvent, getEvents, getEventbyId, updateEvent, deleteEvent } from "../controllers/eventController";

const router = express.router();

router.post("/", createEvent);

router.get("/", getEvent);

router.get("/:id", getEventbyId);

router.put("/:id", updateEvent);

router.delete("/:id", deleteEvent);

export default router;