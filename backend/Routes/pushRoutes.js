const express = require('express');
const router = express.Router();

// DHYAN: apni dusri routes file (jaise appointmentRoutes.js) mein dekho
// authMiddleware kaise import hota hai, wahi style yahan rakho
const auth = require('../Middleware/authMiddleware');
const PushSubscription = require('../Modules/PushSubscription');

// Frontend yahan subscription save karwata hai
router.post('/subscribe', auth, async (req, res) => {
  try {
    const subscription = req.body?.subscription; // frontend se aaya subscription

    if (!subscription?.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }

    // DHYAN: apne middleware ke hisaab se user id yahan se lo (req.user._id / req.userId etc.)
    const userId = req.user?._id || req.user?.userid || req.userId;

    // Same device pe dobara subscribe ho to naya entry nahi, purana update hoga
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { userId, subscription, endpoint: subscription.endpoint },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('subscribe error:', err.message);
    res.status(500).json({ message: 'Unable to save subscription' });
  }
});

module.exports = router;