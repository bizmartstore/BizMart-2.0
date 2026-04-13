// Firebase client configuration - ONLY safe operations
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

// Use environment variables for Firebase configuration
// These will be set via Supabase secrets or edge function configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bizmart-aaf1b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "310239525651",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:310239525651:web:d65ab855cdef15919ab8e6",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FP54T49NG5"
};

console.log("[Firebase] Initialized with project:", firebaseConfig.projectId);

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

let messaging: Messaging | null = null;

// Only initialize messaging in the browser with proper error handling
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    // Check if FCM is enabled via environment
    const fcmEnabled = import.meta.env.VITE_FCM_ENABLED === 'true';
    
    if (fcmEnabled) {
      messaging = getMessaging(app);
    } else {
      console.log("[Firebase] FCM messaging disabled via environment variable");
    }
  } catch (error) {
    console.error("[Firebase] Messaging failed to initialize:", error);
  }
}

export { app, messaging, getToken, onMessage };

// VAPID key for FCM - this is safe to expose as it's a public key
// Only used when user explicitly grants FCM permissions
export const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || "BLiQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE";

// Safe Firebase operations only
console.log("[Firebase] Configuration loaded successfully");
