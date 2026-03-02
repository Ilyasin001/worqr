import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
    shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift',
        required: true
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    breakDuration: {
        type: Number,
        default: 0
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    hourlyRate: Number
}, { timestamps: true });

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;