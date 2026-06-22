import Event from "../models/event.js";
import { AppError } from "../utils/appError.js";
import { fillCountsByEvent, fillCountForEvent } from "../services/eventStats.js";

export const createEvent = async (req, res, next) => {
    try {
        const { title, description, date, address, status, capacity, notes } = req.body;
        const newEvent = await Event.create({
            title, description, date, address, status, capacity, notes,
            createdBy: req.user._id,
            company: req.companyId,
        });
        res.status(201).json(newEvent);
    } catch (error) {
        next(error);
    }
};

export const getEvents = async (req, res, next) => {
    try {
        const { status, q, from, to } = req.query;
        const filter = { company: req.companyId };

        if (status) filter.status = status;

        if (q) {
            // Case-insensitive search across title, description, and address.
            const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [{ title: rx }, { description: rx }, { address: rx }];
        }

        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = new Date(from);
            if (to) filter.date.$lte = new Date(to);
        }

        const events = await Event.find(filter).sort({ date: 1 }).lean();

        // Attach the live filled count (active assignments) for each event.
        const counts = await fillCountsByEvent(req.companyId);
        for (const ev of events) {
            ev.filledCount = counts.get(String(ev._id)) || 0;
        }

        res.status(200).json(events);
    } catch (error) {
        next(error);
    }
};

export const getEventbyId = async (req, res, next) => {
    try {
        const findEvent = await Event.findOne({ _id: req.params.id, company: req.companyId }).lean();
        if (!findEvent) {
            throw new AppError("Event not found", 404);
        }
        findEvent.filledCount = await fillCountForEvent(req.companyId, findEvent._id);
        res.status(200).json(findEvent);
    } catch (error) {
        next(error);
    }
};

export const updateEvent = async (req, res, next) => {
    try {
        const { title, description, date, address, status, capacity, notes } = req.body;
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (date !== undefined) updates.date = date;
        if (address !== undefined) updates.address = address;
        if (status !== undefined) updates.status = status;
        if (capacity !== undefined) updates.capacity = capacity;
        if (notes !== undefined) updates.notes = notes;

        const updated = await Event.findOneAndUpdate(
            { _id: req.params.id, company: req.companyId },
            updates,
            { new: true, runValidators: true }
        );
        if (!updated) {
            throw new AppError("Event not found", 404);
        }
        res.status(200).json(updated);
    } catch (error) {
        next(error);
    }
};

export const deleteEvent = async (req, res, next) => {
    try {
        const deleted = await Event.findOneAndDelete({ _id: req.params.id, company: req.companyId });
        if (!deleted) {
            throw new AppError("Event not found", 404);
        }
        res.status(200).json({ message: "Event successfully deleted" });
    } catch (error) {
        next(error);
    }
};
