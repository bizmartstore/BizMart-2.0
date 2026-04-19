import { initializeApp } from "firebase/app";
import { getMessaging, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "bizmart-aaf1b.firebaseapp.com",
  projectId: "bizmart-aaf1b",
  storageBucket: "bizmart-aaf1b.firebasestorage.app",
  messagingSenderId: "310239525651",
  appId: "1:310239525651:web:d65ab855cdef15919ab8e6",
};

const app = initializeApp(firebaseConfig);

let messaging: any = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (!supported) {
      console.log("[Firebase] Messaging not supported");
      return;
    }

    messaging = getMessaging(app);

    // Foreground notifications
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
  });
}

export { app, messaging };