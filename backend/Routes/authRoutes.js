const express = require('express')
const router = express.Router()
const {LoginController} = require('../Controller/LoginController')
const {Userdata} = require('../Controller/RegistrationController')
const protect = require('../Middleware/authMiddleware')
const { RefreshTokenController } = require('../Controller/RefreshController');
const {profileController , UpdateProfile } = require('../Controller/profileController')


router.post('/register' , Userdata)
router.post('/login', LoginController)
router.get('/profile', protect, profileController)
router.put('/profile', protect, UpdateProfile)
router.post('/refresh', RefreshTokenController);

module.exports = router;