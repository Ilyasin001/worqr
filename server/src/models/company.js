import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        index: true,
        uppercase: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    settings: {
        timezone: {
            type: String,
            default: "UTC"
        }
    }
}, { timestamps: true });

const Company = mongoose.model("Company", companySchema);

export default Company;
