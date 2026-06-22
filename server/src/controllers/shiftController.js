import Shift from "../models/shift.js";
import Event from "../models/event.js";
import User from "../models/user.js";
import { AppError } from "../utils/appError.js";

// Verifies the event + manager both belong to the caller's company.
const assertShiftRefsInCompany = async (companyId, eventId, managerId) => {
    const event = await Event.findOne({ _id: eventId, company: companyId });
    if (!event) {
        throw new AppError("Event not found in your company", 400);
    }
    const manager = await User.findOne({ _id: managerId, company: companyId });
    if (!manager) {
        throw new AppError("Manager not found in your company", 400);
    }
};

export const createShift = async (req, res, next) => {
    try {
        const { managerId, startTime, endTime, eventId, confirmed } = req.body;
        await assertShiftRefsInCompany(req.companyId, eventId, managerId);

        const newShift = await Shift.create({
            managerId, startTime, endTime, eventId, confirmed,
            company: req.companyId,
        });
        res.status(201).json(newShift);
    } catch (error) {
        next(error);
    }
};

export const getShifts = async (req, res, next) => {
    try {
        const shifts = await Shift.find({ company: req.companyId });
        res.status(200).json(shifts);
    } catch (error) {
        next(error);
    }
};

export const getShiftById = async (req, res, next) => {
    try {
        const foundShift = await Shift.findOne({ _id: req.params.id, company: req.companyId });
        if (!foundShift) {
            throw new AppError("Shift not found", 404);
        }
        res.status(200).json(foundShift);
    } catch (error) {
        next(error);
    }
};

export const updateShift = async (req, res, next) => {
    try {
        const { managerId, eventId } = req.body;
        if (managerId || eventId) {
            const existing = await Shift.findOne({ _id: req.params.id, company: req.companyId });
            if (!existing) {
                throw new AppError("Shift not found", 404);
            }
            await assertShiftRefsInCompany(
                req.companyId,
                eventId ?? existing.eventId,
                managerId ?? existing.managerId
            );
        }

        // Never let the body relocate a record to another tenant.
        const { company, _id, ...updates } = req.body;

        const updatedShift = await Shift.findOneAndUpdate(
            { _id: req.params.id, company: req.companyId },
            updates,
            { new: true, runValidators: true }
        );
        if (!updatedShift) {
            throw new AppError("Shift not found", 404);
        }
        res.status(200).json(updatedShift);
    } catch (error) {
        next(error);
    }
};

export const deleteShift = async (req, res, next) => {
    try {
        const deletedShift = await Shift.findOneAndDelete({ _id: req.params.id, company: req.companyId });
        if (!deletedShift) {
            throw new AppError("Shift not found", 404);
        }
        res.status(200).json({ message: "Shift deleted successfully" });
    } catch (error) {
        next(error);
    }
};
