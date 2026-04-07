// Firebase Cloud Messaging Service Worker (Classic Script)
// This file MUST be in /public/ and use importScripts (NOT ES modules)

// Import Firebase compat libraries (v9 compat for service worker)
importScripts(
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js'
);

// Initialize Firebase with your config
try {
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
} catch (e) {
  // Firebase already initialized (duplicate attempt)
  console.warn('[FCM] Firebase already initialized:', e.message);
}

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] Background message received:', payload);
  
  const { title, body, icon, data } = payload.notification || {};
  
  // Customize notification options
  const options = {
    body: body || "You have a new notification",
    icon: icon || "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    vibrate: [200, 100, 200],
    data: data || {},
    // Use custom sound for customer notifications
    sound: data?.role === 'customer' ? 'customer-notification.mp3' : undefined,
  };

  // Show notification
  self.registration.showNotification(title || "BizMart Notification", options);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM] Notification click received');
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle push event (for legacy support)
self.addEventListener('push', (event) => {
  console.log('[FCM] Push event received:', event);
  
  if (!event.data) return;
  
  try {
    const payload = event.data.json();
    const { title, body, icon, data } = payload.notification || {};
    
    const options = {
      body: body || "New notification",
      icon: icon || "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      vibrate: [200, 100, 200],
      data: data || {},
      sound: data?.role === 'customer' ? 'customer-notification.mp3' : undefined,
    };
    
    event.waitUntil(
      self.registration.showNotification(title || "BizMart", options)
    );
  } catch (e) {
    console.error('[FCM] Push event error:', e);
  }
});