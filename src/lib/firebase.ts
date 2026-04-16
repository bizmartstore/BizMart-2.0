import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

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
    // Register service worker with error handling
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        type: 'classic'
      }).then((registration) => {
        console.log('[Firebase] Service Worker registered with scope:', registration.scope);
      }).catch((error) => {
        console.warn('[Firebase] Service Worker registration failed (this is OK if notifications are not needed):', error.message);
      });
    }

    // Initialize messaging
    messaging = getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging not available:", error instanceof Error ? error.message : String(error));
  }
}

export { app, messaging };
export const VAPID_KEY = "BLiQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE";
