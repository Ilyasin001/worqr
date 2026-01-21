import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    hourlyRate: {
        type: Number,
        required: true,
        default: 8.00
    },
    active : {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['manager', 'employee'],
        default: 'employee'
    }
}, {timestamps: true });

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;