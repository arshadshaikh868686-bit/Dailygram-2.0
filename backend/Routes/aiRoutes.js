const express = require('express');
const router = express.Router();

const AiController = require('../Controller/AiController');

router.post('/timetable', AiController.generateTimetable);
router.post('/chat', AiController.chat);

module.exports = router;