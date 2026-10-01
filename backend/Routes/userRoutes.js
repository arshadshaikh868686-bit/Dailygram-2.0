const express = require('express')

const router = express.Router()

const { MentorSearch } = require('../Controller/searchMentors')

const {
    profileController,
    UpdateProfile,
    getMentorProfile,
    submitMentorVerification
} = require('../Controller/profileController')

const protect = require('../Middleware/authMiddleware')

// Mentor verification
router.post(
    '/mentor/verification',
    protect,
    submitMentorVerification
)

// Mentor search
router.get(
    '/mentors',
    protect,
    MentorSearch
)

// Logged-in user's profile
router.get(
    '/profile',
    protect,
    profileController
)

// Update logged-in user's profile
router.put(
    '/profile',
    protect,
    UpdateProfile
)

// View another mentor's profile
router.get(
    '/mentor/:id',
    protect,
    getMentorProfile
)

module.exports = router