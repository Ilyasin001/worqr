import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["staff", "admin"],
        default: "staff"
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff"
    }
}, {timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default Note;