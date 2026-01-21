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
    role: {
        type: String,
        enum: ["staff", "manager"],
        default: "staff"
    },
    breakDuration: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;