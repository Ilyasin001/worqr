import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
    shiftManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    breakMinutes: {
        type: Number,
        default: 0
    },
    confirmed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Shift = mongoose.model('Shift', shiftSchema);

export default Shift;