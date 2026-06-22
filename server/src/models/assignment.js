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
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    breakDuration: { // in minutes
        type: Number,
        default: 0,
        min: 0
    },
    actualStartTime: {
        type: Date,
        required: false  
    },
    actualEndTime: {
        type: Date,
        required: false
    },
    hourlyRate: {
        type: Number,
        required: true,
        min: 0
    },
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

assignmentSchema.pre('save', function() {
    if (this.actualStartTime && this.actualEndTime && this.actualEndTime <= this.actualStartTime) {
        throw Object.assign(new Error('Actual end time must be after actual start time'), { statusCode: 400 });
    }
});

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;