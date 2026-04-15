// Update Firebase service worker to use correct CDN URLs
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC8lS2_jwxlJfG41Ibdy1D__PDalIajf10",
  authDomain: "bizmart-aaf1b.firebaseapp.com",
  databaseURL: "https://bizmart-aaf1b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bizmart-aaf1b",
  storageBucket: "bizmart-aaf1b.firebasestorage.app",
  messagingSenderId: "310239525651",
  appId: "1:310239525651:web:d65ab855cdef15919ab8e6",
  measurementId: "G-FP54T49NG5"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Handle notification display
  if (payload.notification) {
    self.registration.showNotification(payload.notification.title || 'New Message', {
      body: payload.notification.body,
      icon: '/pwa-192x192.png',
      data: payload.data || {},
      vibrate: [200, 100, 200],
      tag: 'firebase-message'
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Extract link from data payload
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

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(self.clients.claim());
});