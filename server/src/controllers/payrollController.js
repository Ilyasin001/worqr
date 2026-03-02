import PayrollBatch from "../models/payrollBatch.js";
import { calculatePayrollPreview } from "../services/payrollService.js";
import Assignment from "../models/assignment.js";
import mongoose from "mongoose";

export const createPayrollDraft = async (req, res) => {

    const { staffId, periodStart, periodEnd } = req.body;

    const preview = await calculatePayrollPreview(
        staffId,
        new Date(periodStart),
        new Date(periodEnd)
    );

    const existing = await PayrollBatch.findOne({
    staff: staffId,
    periodStart,
    periodEnd,
    status: { $in: ["draft", "approved"] }
    });

    if (existing) {
    return res.status(400).json({
        message: "Payroll already exists for this period"
    });
    }
    const batch = await PayrollBatch.create({
        staff: staffId,
        periodStart,
        periodEnd,
        totalHours: preview.totalHours,
        totalPay: preview.totalPay,
        assignments: preview.assignments.map(a => a._id),
        status: "draft",
        processedBy: req.user.userId
    });

    res.json(batch);
};

export const approvePayroll = async (req, res) => {

    const batch = await PayrollBatch.findById(req.params.id);

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
};

export const finalizePayroll = async (req, res) => {

    const batch = await PayrollBatch.findById(req.params.id);

    if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
    }

    if (batch.status !== "approved") {
        return res.status(400).json({ message: "Must be approved first" });
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
    res.status(500).json({ message: "Payroll failed" });
    }
};

