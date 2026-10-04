const mongoose = require('mongoose'); // mongoose import

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      index: true
    },
    subscription: { type: Object, required: true },
    endpoint: { type: String, required: true, unique: true } 
  },
  { timestamps: true } 
);

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);