import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
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
    confirmed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Shift = mongoose.model('Shift', shiftSchema);

export default Shift;