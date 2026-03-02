import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    },
    startTime: Date,
    endTime: Date
}, { timestamps: true });

const Shift = mongoose.model('Shift', shiftSchema);

export default Shift;