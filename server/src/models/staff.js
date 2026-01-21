import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true,
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