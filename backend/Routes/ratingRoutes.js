const express = require('express');

const router = express.Router();

const protect = require('../Middleware/authMiddleware');

const {
    submitRating,
    getAppointmentRating
} = require('../Controller/ratingController');


// Submit rating
router.post(
    '/:appointmentId',
    protect,
    submitRating
);


// Get existing rating
router.get(
    '/:appointmentId',
    protect,
    getAppointmentRating
);


module.exports = router;