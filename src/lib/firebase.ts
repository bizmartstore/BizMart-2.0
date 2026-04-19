import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";
import { onMessage } from "firebase/messaging";

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

const app = initializeApp(firebaseConfig);

let messaging: any = null;

// Only initialize messaging in the browser
if (typeof window !== "undefined") {
  try {
    // Register service worker - use classic type and handle errors gracefully
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        type: 'classic'
      }).then((registration) => {
        console.log('[Firebase] Service Worker registered with scope:', registration.scope);
      }).catch((error) => {
        console.warn('[Firebase] Service Worker registration failed (non-critical):', error);
      });
    }

    // Initialize messaging
    messaging = getMessaging(app);

    // Handle foreground notifications
    onMessage(messaging, (payload) => {
      console.log("[Firebase] Foreground message received:", payload);
      const { title, body, icon } = payload.notification || {};
      const { link } = payload.data || {};

      // Show notification
      if (title && body) {
        const notification = new Notification(title, {
          body,
          icon,
        });

        // Navigate to the link when clicked
        notification.onclick = () => {
          window.location.href = link || "/";
        };
      }
    });
  } catch (error) {
    console.warn("Firebase Messaging not available:", error);
  }
}

export { app, messaging };