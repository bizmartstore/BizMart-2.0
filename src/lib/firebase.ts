import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

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

let messaging: Messaging | null = null;

// Only initialize messaging in the browser
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    // Register service worker first
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        type: 'module'
      }).then((registration) => {
        console.log('[Firebase] Service Worker registered with scope:', registration.scope);
      }).catch((error) => {
        console.error('[Firebase] Service Worker registration failed:', error);
      });
    }

    // Then initialize messaging
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Firebase Messaging failed to initialize:", error);
  }
}

export { app, messaging, getToken, onMessage };
export const VAPID_KEY = "BLiQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE";