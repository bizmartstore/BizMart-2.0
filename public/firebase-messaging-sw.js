import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onBackgroundMessage } from "firebase/messaging/sw";

// Firebase configuration (same as in firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyC8lS2_jwxlJfG41Ibdy1D__PDalIajf10",
  authDomain: "bizmart-aaf1b.firebaseapp.com",
  databaseURL: "https://bizmart-aaf1b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bizmart-aaf1b",
  storageBucket: "bizmart-aaf1b.firebasestorage.app",
  messagingSenderId: "310239525651",
  appId: "1:310239525651:web:d65ab855cdef15919ab8e6",
  measurementId: "G-FP54T49NG5",
};

// Initialize Firebase in service worker
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log("[firebase-messaging-sw] Background message received:", payload);
  
  const { title, body, icon, data } = payload.notification || {};
  
  // Show notification with custom sound for customers
  const options = {
    body: body || "You have a new notification",
    icon: icon || "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    vibrate: [200, 100, 200],
    data: data || {},
    // Use custom sound for customer notifications
    sound: data?.role === 'customer' ? 'customer-notification.mp3' : undefined,
  };

  self.registration.showNotification(title || "BizMart Notification", options);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw] Notification click received");
  
  event.notification.close();
  
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});