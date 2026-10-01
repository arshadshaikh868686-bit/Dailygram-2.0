const express = require('express');

const router = express.Router();

const protect = require('../Middleware/authMiddleware');

const {
    createPremiumOrder,
    verifyPremiumPayment,
    createMentorshipOrder,
    verifyMentorshipPayment
} = require('../Controller/PaymentController');

// Premium payment
router.post(
    '/premium/order',
    protect,
    createPremiumOrder
);

router.post(
    '/premium/verify',
    protect,
    verifyPremiumPayment
);

// Mentorship payment
router.post(
    '/mentorship/order',
    protect,
    createMentorshipOrder
);

router.post(
    '/mentorship/verify',
    protect,
    verifyMentorshipPayment
);

module.exports = router;