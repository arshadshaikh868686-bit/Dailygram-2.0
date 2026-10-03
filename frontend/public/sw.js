// Naya service worker turant active ho jaye (purane ke wait ke bina)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Server se push aane par ye chalega
self.addEventListener('push', (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json(); // server ka bheja hua JSON
    } catch {
      data = { body: event.data.text() }; // DevTools ka plain text test bhi chalega
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Dailygram', {
      body: data.body || '', // notification ka text
      data: { url: data.url || '/' } // click par kahan jana hai
    })
  );
});

// Notification par click karne par
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // notification band karo

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true }) // khule hue tabs dhundo
      .then((tabs) => {
        for (const tab of tabs) {
          if ('focus' in tab) {
            tab.navigate?.(url); // site khuli hai to usi tab mein sahi page kholo
            return tab.focus();
          }
        }
        return clients.openWindow(url); // khuli nahi hai to naya tab kholo
      })
  );
});