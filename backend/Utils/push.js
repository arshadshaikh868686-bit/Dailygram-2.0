const webpush = require('web-push'); // push bhejne wali library
const PushSubscription = require('../Modules/PushSubscription'); // upar bana model

// Teeno env variables hon tabhi push chalega, warna server crash nahi hoga
const enabled = Boolean(
  process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_EMAIL
);

if (enabled) {
  // VAPID: batata hai ki push hamare server se aa raha hai
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Kisi bhi user ko notification bhejne ka function
async function sendPush(userId, payload) {
  if (!enabled) return; // keys nahi hain to chupchap return

  const subs = await PushSubscription.find({ userId }); // user ke saare devices

  await Promise.all(
    subs.map(async (sub) => {
      try {
        // payload ko text (JSON) bana ke bhejna padta hai
        await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // device ne notification band kar di ya subscription expire, DB se hata do
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error('push error:', err.message); // baaki errors sirf log karo
        }
      }
    })
  );
}

module.exports = { sendPush };