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
    hourlyRate: {
        type: Number,
        required: false,
        default: 8.00
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;