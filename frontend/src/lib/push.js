import api from './api'; // tumhara axios instance (token ke saath)

// VAPID public key (base64) ko browser ke format mein badalna
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
};

export async function enablePush() {
  // Browser push support karta hai ya nahi
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY; // Vercel env se aayegi
  if (!publicKey) return { ok: false, reason: 'missing-key' };

  // User se permission maango (popup aayega)
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  const registration = await navigator.serviceWorker.register('/sw.js'); // service worker register
  await navigator.serviceWorker.ready; // ready hone ka wait

  // Pehle se subscribed ho to wahi use karo, nahi to naya banao
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // har push par notification dikhegi (zaroori)
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
  }

  // Subscription backend ko bhejo, wahan DB mein save hoga
  await api.post('/push/subscribe', { subscription: subscription.toJSON() });

  return { ok: true };
}