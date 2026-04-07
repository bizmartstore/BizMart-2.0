// Firebase Cloud Messaging Service Worker (Classic Script)
// This file MUST be in /public/ and use importScripts (NOT ES modules)

importScripts(
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js'
);

try {
  if (!firebase.apps.length) {
    firebase.initializeApp({
      apiKey: "AIzaSyC8lS2_jwxlJfG41Ibdy1D__PDalIajf10",
      authDomain: "bizmart-aaf1b.firebaseapp.com",
      databaseURL: "https://bizmart-aaf1b-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "bizmart-aaf1b",
      storageBucket: "bizmart-aaf1b.firebasestorage.app",
      messagingSenderId: "310239525651",
      appId: "1:310239525651:web:d65ab855cdef15919ab8e6",
      measurementId: "G-FP54T49NG5"
    });
  }
} catch (e) {
  console.warn('[FCM] Firebase init in SW failed:', e);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] Background message received:', payload);
  const { title, body, icon, data } = payload.notification || {};
  
  const options = {
    body: body || "You have a new notification",
    icon: icon || "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    vibrate: [200, 100, 200],
    data: data || {},
    sound: data?.role === 'customer' ? '/sounds/customer-notification.mp3' : undefined,
  };

  self.registration.showNotification(title || "BizMart Notification", options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});