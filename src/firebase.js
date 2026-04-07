import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
const messaging = getMessaging(app);

// Handle background messagesonMessage(messaging, (payload) => {
  console.log("[FCM] Received message:", payload);
  // Forward to existing notification system  const { title, body, type } = payload.notification;
  // Dispatch to existing notification handling (will be implemented in notifications.ts)
  // This is a placeholder – actual handling will be triggered via Supabase edge function
});

export { messaging, getToken as getFCMToken };