import Shift from "../models/shift.js";
import Event from "../models/event.js";
import User from "../models/user.js";
import Assignment from "../models/assignment.js";
import { AppError } from "../utils/appError.js";
import { assertNoStaffConflict } from "../services/assignmentConflicts.js";

const MAX_RECURRENCE = 60;

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

// Builds the recurrence series: same time-of-day, offset by day (daily) or week.
const buildOccurrences = (base, frequency, count) => {
    const stepDays = frequency === "weekly" ? 7 : 1;
    const occurrences = [];
    for (let i = 0; i < count; i++) {
        const start = new Date(base.startTime);
        const end = new Date(base.endTime);
        start.setDate(start.getDate() + stepDays * i);
        end.setDate(end.getDate() + stepDays * i);
        occurrences.push({ ...base, startTime: start, endTime: end });
    }
    return occurrences;
};

export const createShift = async (req, res, next) => {
    try {
        const { managerId, startTime, endTime, eventId, confirmed, repeat } = req.body;
        await assertShiftRefsInCompany(req.companyId, eventId, managerId);

        const base = { managerId, eventId, startTime, endTime, confirmed, company: req.companyId };

        // Recurring shift: generate a series of occurrences.
        if (repeat && repeat.frequency) {
            const count = Math.min(Math.max(Number(repeat.count) || 1, 1), MAX_RECURRENCE);
            if (!["daily", "weekly"].includes(repeat.frequency)) {
                throw new AppError("Recurrence frequency must be daily or weekly", 400);
            }
            // Shift.create validates each doc and runs the start<end pre-save hook.
            const created = await Shift.create(buildOccurrences(base, repeat.frequency, count));
            return res.status(201).json(created);
        }

        const newShift = await Shift.create(base);
        res.status(201).json(newShift);
    } catch (error) {
        next(error);
    }
};

// Shifts the caller could pick up: upcoming shifts in their company they don't
// already hold an active assignment on.
export const getOpenShifts = async (req, res, next) => {
    try {
        const myShiftIds = await Assignment.find({
            company: req.companyId,
            staffId: req.user._id,
            status: { $in: ["assigned", "confirmed"] },
        }).distinct("shiftId");

        const shifts = await Shift.find({
            company: req.companyId,
            _id: { $nin: myShiftIds },
            startTime: { $gte: new Date() },
        }).sort({ startTime: 1 });

        res.status(200).json(shifts);
    } catch (error) {
        next(error);
    }
};

// A staff member claims an open shift, self-assigning at their own hourly rate.
export const claimShift = async (req, res, next) => {
    try {
        const shift = await Shift.findOne({ _id: req.params.id, company: req.companyId });
        if (!shift) {
            throw new AppError("Shift not found", 404);
        }

        const already = await Assignment.findOne({
            shiftId: shift._id,
            staffId: req.user._id,
            company: req.companyId,
            status: { $in: ["assigned", "confirmed"] },
        });
        if (already) {
            throw new AppError("You are already assigned to this shift", 409);
        }

        await assertNoStaffConflict(req.companyId, req.user._id, shift);

        const assignment = await Assignment.create({
            shiftId: shift._id,
            staffId: req.user._id,
            company: req.companyId,
            hourlyRate: req.user.hourlyRate ?? 0,
            status: "confirmed",
        });
        res.status(201).json(assignment);
    } catch (error) {
        next(error);
    }
};

export const getShifts = async (req, res, next) => {
    try {
        const { eventId, confirmed, from, to } = req.query;
        const filter = { company: req.companyId };

        if (eventId) filter.eventId = eventId;
        if (confirmed !== undefined) filter.confirmed = confirmed === "true";

        if (from || to) {
            filter.startTime = {};
            if (from) filter.startTime.$gte = new Date(from);
            if (to) filter.startTime.$lte = new Date(to);
        }

        const shifts = await Shift.find(filter).sort({ startTime: 1 });
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
