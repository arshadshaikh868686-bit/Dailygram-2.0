const express = require('express')
const router = express.Router()
const {oldChats} = require('../Controller/messageController')
const protect = require('../Middleware/authMiddleware')

router.get('/:appointmentId' , protect , oldChats)

module.exports = router;