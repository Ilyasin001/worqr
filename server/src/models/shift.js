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
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    startTime: { 
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    confirmed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

shiftSchema.pre('save', function() {
    if (this.endTime <= this.startTime) {
        throw Object.assign(new Error('End time must be after start time'), { statusCode: 400 });
    }
});

const Shift = mongoose.model('Shift', shiftSchema);

export default Shift;