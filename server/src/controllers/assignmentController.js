import Assignment from "../models/assignment.js";
import Shift from "../models/shift.js";
import User from "../models/user.js";
import { AppError } from "../utils/appError.js";
import { assertNoStaffConflict } from "../services/assignmentConflicts.js";

// Verifies the shift + staff member both belong to the caller's company and
// returns the loaded shift (needed for conflict detection).
const assertAssignmentRefsInCompany = async (companyId, shiftId, staffId) => {
    const shift = await Shift.findOne({ _id: shiftId, company: companyId });
    if (!shift) {
        throw new AppError("Shift not found in your company", 400);
    }
    const staff = await User.findOne({ _id: staffId, company: companyId });
    if (!staff) {
        throw new AppError("Staff member not found in your company", 400);
    }
    return shift;
};

export const createAssignment = async (req, res, next) => {
    try {
        const { shiftId, staffId, hourlyRate, breakDuration } = req.body;
        const shift = await assertAssignmentRefsInCompany(req.companyId, shiftId, staffId);
        await assertNoStaffConflict(req.companyId, staffId, shift);

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
            const shift = await assertAssignmentRefsInCompany(
                req.companyId,
                shiftId ?? existing.shiftId,
                staffId ?? existing.staffId
            );
            // Reassigning staff (or moving to a new shift) must not double-book them.
            await assertNoStaffConflict(req.companyId, staffId ?? existing.staffId, shift, existing._id);
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

// Status transitions. Staff may confirm/decline their OWN assignment; admins
// may set any in-company assignment to any status (incl. cancel / re-assign).
const STAFF_ALLOWED = ["confirmed", "declined"];

export const updateAssignmentStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const assignment = await Assignment.findOne({ _id: req.params.id, company: req.companyId });
        if (!assignment) {
            throw new AppError("Assignment not found", 404);
        }

        const isAdmin = req.user.role === "admin";
        const isOwner = assignment.staffId.toString() === req.user._id.toString();

        if (!isAdmin) {
            if (!isOwner) {
                throw new AppError("You can only update your own assignments", 403);
            }
            if (!STAFF_ALLOWED.includes(status)) {
                throw new AppError("You can only confirm or decline an assignment", 403);
            }
        }

        assignment.status = status;
        await assignment.save();
        res.status(200).json(assignment);
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
