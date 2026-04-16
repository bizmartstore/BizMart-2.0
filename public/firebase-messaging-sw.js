// Firebase service worker - Minimal version that won't fail if Firebase SDKs don't load
// This prevents service worker registration failures

// Simple fallback service worker that doesn't depend on Firebase SDKs
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received, but Firebase not loaded');
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.link || event.notification.data?.url || '/';
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
