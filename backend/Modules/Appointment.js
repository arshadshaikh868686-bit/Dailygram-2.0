const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
    {
        learnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        status: {
            type: String,
            enum: [
                'pending',
                'accepted',
                'rejected',
                'completed'
            ],
            default: 'pending'
        },

        skill: {
            type: String,
            required: true,
            trim: true
        },

        scheduledAt: {
            type: Date
        },

        duration: {
            type: Number,
            default: 60,
            min: 15,
            max: 180
        },

        mentorshipPrice: {
            type: Number,
            min: 0,
            default: 0
        },

        paymentStatus: {
            type: String,
            enum: [
                'not_required',
                'pending',
                'paid',
                'failed',
                'refunded'
            ],
            default: 'not_required'
        },

        paymentOrderId: {
            type: String,
            default: '',
            trim: true
        },

        paymentId: {
            type: String,
            default: '',
            trim: true
        },

        room: {
            type: String,
            trim: true
        },

        // -----------------------------
        // Mentor rating
        // -----------------------------

        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },

        review: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ''
        },

        ratedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Appointment = mongoose.model(
    'Appointment',
    AppointmentSchema
);

module.exports = Appointment;