const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        role: {
            type: String,
            enum: ['mentor', 'learner', 'admin'],
            required: true
        },

        skills: [
            {
                type: String,
                trim: true
            }
        ],

        bio: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ''
        },

        experience: {
            type: Number,
            min: 0,
            default: 0
        },

        companyName: {
            type: String,
            trim: true,
            maxlength: 150,
            default: ''
        },

        profileImage: {
            type: String,
            default: ''
        },

        linkedinUrl: {
            type: String,
            trim: true,
            default: ''
        },

        resumeUrl: {
            type: String,
            trim: true,
            default: ''
        },

        // Average mentor rating
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },

        // Number of ratings received
        ratingCount: {
            type: Number,
            min: 0,
            default: 0
        },

        // Total stars received
        // Example:
        // 5 + 4 + 5 = 14
        ratingTotal: {
            type: Number,
            min: 0,
            default: 0
        },

        // Successfully completed mentorship sessions
        completedSessions: {
            type: Number,
            min: 0,
            default: 0
        },

        aadhaarVerificationStatus: {
            type: String,
            enum: [
                'not_submitted',
                'pending',
                'verified',
                'rejected'
            ],
            default: 'not_submitted'
        },

        // Legacy marketplace approval fields.
        // These are no longer required for marketplace visibility.
        mentorApproved: {
            type: Boolean,
            default: false
        },

        mentorApprovedAt: {
            type: Date,
            default: null
        },

        mentorApprovedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        // ₹0 = free mentorship
        mentorshipPrice: {
            type: Number,
            min: 0,
            default: 0
        },

        firstMentorshipPrice: {
            type: Number,
            min: 0,
            default: 0
        },

        // Eligible means mentor can be reviewed
        // for Premium by Dailygram team.
        premiumEligible: {
            type: Boolean,
            default: false
        },

        // Final Dailygram team approval
        premiumEnabled: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(
        this.password,
        salt
    );
});

UserSchema.methods.comparePassword = async function (
    candidatePassword
) {
    return bcrypt.compare(
        candidatePassword,
        this.password
    );
};

module.exports = mongoose.model(
    'User',
    UserSchema
);