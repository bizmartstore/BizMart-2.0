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

// ✅ FIX: initialize properly with async IIFE
(async () => {
  if (typeof window === "undefined") return;

  const supported = await isSupported();
  if (!supported) {
    console.log("[Firebase] Messaging not supported");
    return;
  }

  messaging = getMessaging(app);

  onMessage(messaging, (payload) => {
    console.log("[Firebase] Foreground message:", payload);

    const { title, body, icon } = payload.notification || {};
    const { link } = payload.data || {};

    if (title && body) {
      const notification = new Notification(title, {
        body,
        icon: icon || "/pwa-192x192.png",
      });

      notification.onclick = () => {
        window.location.href = link || "/";
      };
    }
  });
})();

export { app, messaging };