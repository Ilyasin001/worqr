import Assignment from "../models/assignment.js";
import Shift from "../models/shift.js";
import User from "../models/user.js";
import { AppError } from "../utils/appError.js";

// Verifies the shift + staff member both belong to the caller's company.
const assertAssignmentRefsInCompany = async (companyId, shiftId, staffId) => {
    const shift = await Shift.findOne({ _id: shiftId, company: companyId });
    if (!shift) {
        throw new AppError("Shift not found in your company", 400);
    }
    const staff = await User.findOne({ _id: staffId, company: companyId });
    if (!staff) {
        throw new AppError("Staff member not found in your company", 400);
    }
};

export const createAssignment = async (req, res, next) => {
    try {
        const { shiftId, staffId, hourlyRate, breakDuration } = req.body;
        await assertAssignmentRefsInCompany(req.companyId, shiftId, staffId);

        const newAssignment = await Assignment.create({
            shiftId, staffId, hourlyRate, breakDuration,
            company: req.companyId,
        });
        res.status(201).json(newAssignment);
    } catch (error) {
        next(error);
    }
};

export const getAssignments = async (req, res, next) => {
    try {
        const assignments = await Assignment.find({ company: req.companyId });
        res.status(200).json(assignments);
    } catch (error) {
        next(error);
    }
};

export const getAssignmentById = async (req, res, next) => {
    try {
        const found = await Assignment.findOne({ _id: req.params.id, company: req.companyId });
        if (!found) {
            throw new AppError("Assignment not found", 404);
        }
        res.status(200).json(found);
    } catch (error) {
        next(error);
    }
};

export const updateAssignment = async (req, res, next) => {
    try {
        const { shiftId, staffId } = req.body;
        if (shiftId || staffId) {
            const existing = await Assignment.findOne({ _id: req.params.id, company: req.companyId });
            if (!existing) {
                throw new AppError("Assignment not found", 404);
            }
            await assertAssignmentRefsInCompany(
                req.companyId,
                shiftId ?? existing.shiftId,
                staffId ?? existing.staffId
            );
        }

        // Never let the body relocate a record to another tenant.
        const { company, _id, ...updates } = req.body;

        const updated = await Assignment.findOneAndUpdate(
            { _id: req.params.id, company: req.companyId },
            updates,
            { new: true, runValidators: true }
        );
        if (!updated) {
            throw new AppError("Assignment not found", 404);
        }
        res.status(200).json(updated);
    } catch (error) {
        next(error);
    }
};

export const deleteAssignment = async (req, res, next) => {
    try {
        const deleted = await Assignment.findOneAndDelete({ _id: req.params.id, company: req.companyId });
        if (!deleted) {
            throw new AppError("Assignment not found", 404);
        }
        res.status(200).json({ message: "Assignment deleted successfully" });
    } catch (error) {
        next(error);
    }
};
