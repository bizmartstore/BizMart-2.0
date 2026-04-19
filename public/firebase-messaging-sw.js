// Firebase service worker - Minimal version that won't make authenticated requests
// This prevents refresh token errors and service worker issues

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC8lS2_jwxlJfG41Ibdy1D__PDalIajf10",
  authDomain: "bizmart-aaf1b.firebaseapp.com",
  projectId: "bizmart-aaf1b",
  storageBucket: "bizmart-aaf1b.firebasestorage.app",
  messagingSenderId: "310239525651",
  appId: "1:310239525651:web:d65ab855cdef15919ab8e6",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Set the VAPID key for the service worker
messaging.useServiceWorker(registration);

self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received');

  // Parse the Firebase payload
  let data;
  try {
    data = event.data?.json();
  } catch (e) {
    console.error('Failed to parse push event data:', e);
    data = null;
  }

  // Extract notification details
  const title = data?.notification?.title || 'New Notification';
  const body = data?.notification?.body || 'You have a new notification';
  const icon = data?.notification?.icon || '/pwa-192x192.png';
  const link = data?.data?.link || '/';

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/pwa-192x192.png',
      data: { link },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.link || '/';

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