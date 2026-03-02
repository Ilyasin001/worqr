import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
    shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift',
        required: true
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    breakDuration: {
        type: Number,
        default: 0
    },
    actualStartTime: {
        type: Date,
        required: true
    },
    actualEndTime: {
        type: Date,
        required: true
    },
    hourlyRate: Number,
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: Date,
}, { timestamps: true });

assignmentSchema.index(
  { shiftId: 1, staffId: 1 },
  { unique: true }
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;