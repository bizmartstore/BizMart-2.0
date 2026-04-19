import { initializeApp } from "firebase/app";
import { getMessaging, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC8lS2_jwxlJfG41Ibdy1D__PDalIajf10",
  authDomain: "bizmart-aaf1b.firebaseapp.com",
  projectId: "bizmart-aaf1b",
  storageBucket: "bizmart-aaf1b.firebasestorage.app",
  messagingSenderId: "310239525651",
  appId: "1:310239525651:web:d65ab855cdef15919ab8e6",
};

const app = initializeApp(firebaseConfig);

let messaging: any = null;

export const initMessaging = async () => {
  if (typeof window === "undefined") return null;

  const supported = await isSupported();
  if (!supported) {
    console.log("[Firebase] Messaging not supported");
    return null;
  }

  if (!messaging) {
    messaging = getMessaging(app);

    // ✅ Foreground handler (NO system notification here)
    onMessage(messaging, (payload) => {
      console.log("[Firebase] Foreground message:", payload);

      const { title, body } = payload.notification || {};

      // Optional: simple log only (cleanest setup)
      if (title && body) {
        console.log(`[FCM] ${title} - ${body}`);
      }

      // ⚠️ DO NOT use new Notification() here
      // Service worker handles notifications to avoid duplicates
    });
  }

  return messaging;
};

export { app };