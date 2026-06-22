import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: ""
    },
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
        default: "staff",
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
        index: true
    },
    hourlyRate: {
        type: Number,
        required: false,
        default: 8.00
    },
    // Email ownership verification (soft — does not gate login).
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationTokenHash: { type: String, select: false },
    verificationExpires: { type: Date, select: false },
    // Password reset (hashed token + expiry; raw token only ever emailed).
    resetTokenHash: { type: String, select: false },
    resetExpires: { type: Date, select: false }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;