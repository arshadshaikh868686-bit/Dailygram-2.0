// Service worker: site band hone par bhi browser ke background mein chalta hai

// Server se push aane par ye chalega
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}; // server ka bheja hua JSON

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
            tab.navigate?.(url); // site pehle se khuli hai to usi tab mein sahi page kholo
            return tab.focus();
          }
        }
        return clients.openWindow(url); // khuli nahi hai to naya tab kholo
      })
  );
});