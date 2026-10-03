const mongoose = require('mongoose'); // mongoose import

// Har user ke browser/device ka push subscription yahan save hoga
const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // kis user ka subscription hai
      ref: 'User',
      required: true,
      index: true
    },
    subscription: { type: Object, required: true }, // browser se mila poora subscription object
    endpoint: { type: String, required: true, unique: true } // har device ka unique URL (duplicate rokne ke liye)
  },
  { timestamps: true } // createdAt / updatedAt apne aap
);

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);