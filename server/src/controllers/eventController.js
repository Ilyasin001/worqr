import Event from "../models/event.js";
import { AppError } from "../utils/appError.js";

export const createEvent = async (req, res, next) => {
    try {
        const { title, description, date, address } = req.body;
        const newEvent = await Event.create({
            title, description, date, address,
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
        const events = await Event.find({ company: req.companyId });
        res.status(200).json(events);
    } catch (error) {
        next(error);
    }
};

export const getEventbyId = async (req, res, next) => {
    try {
        const findEvent = await Event.findOne({ _id: req.params.id, company: req.companyId });
        if (!findEvent) {
            throw new AppError("Event not found", 404);
        }
        res.status(200).json(findEvent);
    } catch (error) {
        next(error);
    }
};

export const updateEvent = async (req, res, next) => {
    try {
        const { title, description, date, address, status } = req.body;
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (date !== undefined) updates.date = date;
        if (address !== undefined) updates.address = address;
        if (status !== undefined) updates.status = status;

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
