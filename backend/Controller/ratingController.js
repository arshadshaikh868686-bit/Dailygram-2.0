const mongoose = require('mongoose');
const Appointment = require('../Modules/Appointment');
const User = require('../Modules/User');

exports.submitRating = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { rating, review = '' } = req.body;

        if (!mongoose.isValidObjectId(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID' });
        }

        const numericRating = Number(rating);
        if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (String(appointment.learnerId) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Only the learner can rate this appointment' });
        }

        if (appointment.status !== 'completed') {
            return res.status(403).json({ message: 'Rating is available only after the session is completed' });
        }

        if (appointment.rating !== null) {
            return res.status(409).json({ message: 'You have already rated this appointment' });
        }

        const cleanReview = typeof review === 'string' ? review.trim() : '';
        if (cleanReview.length > 500) {
            return res.status(400).json({ message: 'Review cannot be longer than 500 characters' });
        }

        const mentor = await User.findById(appointment.mentorId);
        if (!mentor) {
            return res.status(404).json({ message: 'Mentor not found' });
        }

        const oldRatingTotal = Number(mentor.ratingTotal || 0);
        const oldRatingCount = Number(mentor.ratingCount || 0);
        const newRatingTotal = oldRatingTotal + numericRating;
        const newRatingCount = oldRatingCount + 1;
        const newAverageRating = newRatingTotal / newRatingCount;

        mentor.ratingTotal = newRatingTotal;
        mentor.ratingCount = newRatingCount;
        mentor.rating = Math.round(newAverageRating * 10) / 10;

        if (Number(mentor.completedSessions || 0) >= 100 && Number(mentor.rating || 0) >= 4.5) {
            mentor.premiumEligible = true;
        }

        await mentor.save();

        appointment.rating = numericRating;
        appointment.review = cleanReview;
        appointment.ratedAt = new Date();
        await appointment.save();

        return res.status(200).json({
            message: 'Rating submitted successfully',
            rating: mentor.rating,
            ratingCount: mentor.ratingCount,
            premiumEligible: mentor.premiumEligible
        });
    } catch (error) {
        console.error('Submit rating error:', error);
        return res.status(500).json({ message: 'Unable to submit rating' });
    }
};

exports.getAppointmentRating = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        if (!mongoose.isValidObjectId(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const uid = String(req.user._id);
        const isParticipant = String(appointment.learnerId) === uid || String(appointment.mentorId) === uid;

        if (!isParticipant) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        return res.status(200).json({
            rating: appointment.rating,
            review: appointment.review,
            ratedAt: appointment.ratedAt
        });
    } catch (error) {
        console.error('Get appointment rating error:', error);
        return res.status(500).json({ message: 'Unable to fetch rating' });
    }
};
