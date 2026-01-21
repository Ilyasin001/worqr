import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: false,
    },
    active: {
        type: Boolean,
        default: false
    }
}, {timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;