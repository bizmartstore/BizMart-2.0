// Firebase service worker - Minimal version that won't make authenticated requests
// This prevents refresh token errors and service worker issues

// Simple fallback service worker that only handles basic push notifications
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received');
  
  // Don't try to parse complex data - just show a basic notification
  event.waitUntil(
    self.registration.showNotification('New Notification', {
      body: 'You have a new notification',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { link: '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// This prevents the service worker from failing to register
console.log('[firebase-messaging-sw.js] Service worker loaded successfully');
