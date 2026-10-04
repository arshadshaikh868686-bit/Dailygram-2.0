const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            default: null
        },

        orderId: {
            type: String,
            required: true,
            unique: true
        },

        paymentId: {
            type: String,
            default: ''
        },

        amount: {
            type: Number,
            required: true,
            min: 1
        },

        currency: {
            type: String,
            default: 'INR'
        },

        type: {
            type: String,
            enum: ['premium', 'mentorship'],
            required: true
        },

        status: {
            type: String,
            enum: [
                'created',
                'pending',
                'paid',
                'failed',
                'refunded'
            ],
            default: 'created'
        },

        verified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Payment', PaymentSchema);