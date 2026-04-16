// Firebase service worker - MUST use classic script format (not ES modules)
// This file cannot use ES modules or importScripts with module scripts

// Initialize Firebase app
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

// Load Firebase SDKs - use direct URLs without importScripts if needed
// We'll try to load Firebase from CDN directly in the service worker context
try {
  importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
  
  firebase.initializeApp(firebaseConfig);
  
  const messaging = firebase.messaging();
  
  // Background message handler
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
  });
  
  // Handle notification clicks
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
  
  // Handle push events
  self.addEventListener('push', (event) => {
    if (event.data) {
      try {
        const data = event.data.json();
        const title = data.notification?.title || 'New Notification';
        const options = {
          body: data.notification?.body || '',
          icon: data.notification?.icon || '/icons/icon-192x192.png',
          data: data.data || {}
        };
        
        event.waitUntil(
          self.registration.showNotification(title, options)
        );
      } catch (e) {
        console.error('Error parsing push event data:', e);
      }
    }
  });
  
} catch (error) {
  console.error('[firebase-messaging-sw.js] Failed to initialize Firebase:', error);
  // Service worker will still work, just without Firebase messaging
}
