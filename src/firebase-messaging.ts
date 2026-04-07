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
export const messaging = getMessaging(app);

export async function requestUserPermission() {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey: "BLiQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE"
    });
    return token;
  }
  return null;
}

export function setBackgroundMessageHandler() {
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
  });
}