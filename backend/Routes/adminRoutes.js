const express = require('express');

const router = express.Router();

const protect = require('../Middleware/authMiddleware');
const adminProtect = require('../Middleware/adminMiddleware');

const {
    getVerificationRequests,
    updateVerificationStatus,
    updateMentorApproval,
    updatePremiumStatus,
    getAdminStats
} = require('../Controller/AdminController');



router.get(
    '/stats',
    protect,
    adminProtect,
    getAdminStats
);



router.get(
    '/verification-requests',
    protect,
    adminProtect,
    getVerificationRequests
);




router.put(
    '/verification/:id',
    protect,
    adminProtect,
    updateVerificationStatus
);




router.put(
    '/mentor-approval/:id',
    protect,
    adminProtect,
    updateMentorApproval
);



router.put(
    '/premium/:id',
    protect,
    adminProtect,
    updatePremiumStatus
);


module.exports = router;