import PayrollBatch from "../models/payrollBatch.js";
import { calculatePayrollPreview } from "../services/payrollService.js";
import Assignment from "../models/assignment.js";
import User from "../models/user.js";
import { AppError } from "../utils/appError.js";
import mongoose from "mongoose";

export const createPayrollDraft = async (req, res, next) => {
    try {
        const { staffId, periodStart, periodEnd } = req.body;
        const start = new Date(periodStart);
        const end = new Date(periodEnd);

        // Staff member must belong to the admin's company.
        const staff = await User.findOne({ _id: staffId, company: req.companyId });
        if (!staff) {
            throw new AppError("Staff member not found in your company", 400);
        }

        const preview = await calculatePayrollPreview(staffId, start, end);

        const existing = await PayrollBatch.findOne({
            staff: staffId,
            company: req.companyId,
            periodStart: { $lte: end },
            periodEnd: { $gte: start },
            status: { $in: ["draft", "approved"] }
        });

        if (existing) {
            return res.status(400).json({
                message: "Payroll already exists for this period"
            });
        }

        const batch = await PayrollBatch.create({
            staff: staffId,
            company: req.companyId,
            periodStart,
            periodEnd,
            totalHours: preview.totalHours,
            totalPay: preview.totalPay,
            assignments: preview.assignments.map(a => a._id),
            status: "draft",
            processedBy: req.user._id
        });

        res.json(batch);
    } catch (err) {
        next(err);
    }
};

export const approvePayroll = async (req, res, next) => {
    try {
        const batch = await PayrollBatch.findOne({ _id: req.params.id, company: req.companyId });

        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        if (batch.status !== "draft") {
            return res.status(400).json({ message: "Already processed" });
        }

        batch.status = "approved";
        batch.processedAt = new Date();

        await batch.save();

        res.json({ message: "Payroll approved", batch });
    } catch (err) {
        next(err);
    }
};

export const finalizePayroll = async (req, res, next) => {
    try {
        const batch = await PayrollBatch.findOne({ _id: req.params.id, company: req.companyId });

        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        if (batch.status !== "approved") {
            return res.status(400).json({ message: "Batch must be approved before finalizing" });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await Assignment.updateMany(
                { _id: { $in: batch.assignments } },
                { $set: { isPaid: true, paidAt: new Date() } },
                { session }
            );

            batch.status = "paid";
            await batch.save({ session });

            await session.commitTransaction();
            session.endSession();

            res.json({ message: "Payroll completed", batch });
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    } catch (err) {
        next(err);
    }
};

export const getPayrollBatches = async (req, res, next) => {
    try {
        const { staffId, start, end } = req.query;

        const filter = { company: req.companyId };

        if (staffId) {
            filter.staff = staffId;
        }

        if (start && end) {
            filter.periodStart = { $gte: new Date(start) };
            filter.periodEnd = { $lte: new Date(end) };
        }

        const batches = await PayrollBatch.find(filter)
            .populate("staff", "name email role")
            .sort({ createdAt: -1 });

        res.json(batches);
    } catch (err) {
        next(err);
    }
};

export const getMyPayrollHistory = async (req, res, next) => {
    try {
        const batches = await PayrollBatch.find({
            staff: req.user._id,
            company: req.companyId,
            status: "paid"
        }).sort({ periodStart: -1 });

        res.json(batches);
    } catch (err) {
        next(err);
    }
};

export const getPayrollSummary = async (req, res, next) => {
    try {
        const { year } = req.query;

        const startOfYear = new Date(Date.UTC(Number(year), 0, 1));
        const startOfNextYear = new Date(Date.UTC(Number(year) + 1, 0, 1));

        const summary = await PayrollBatch.aggregate([
            {
                $match: {
                    company: new mongoose.Types.ObjectId(req.companyId),
                    status: "paid",
                    periodStart: { $gte: startOfYear },
                    periodEnd: { $lt: startOfNextYear }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPayroll: { $sum: "$totalPay" },
                    totalHours: { $sum: "$totalHours" },
                    totalBatches: { $sum: 1 }
                }
            }
        ]);

        res.json(summary[0] || {
            totalPayroll: 0,
            totalHours: 0,
            totalBatches: 0
        });
    } catch (err) {
        next(err);
    }
};
