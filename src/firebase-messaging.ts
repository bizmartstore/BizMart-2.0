import { isSupported, getToken } from "firebase/messaging";
import { messaging, VAPID_KEY } from "./firebase";

export async function requestUserPermission() {
  try {
    // 1. Check browser support
    const supported = await isSupported();
    if (!supported) {
      console.warn("Firebase Messaging is not supported in this browser");
      return null;
    }

    // 2. Request browser permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return null;
    }

    // 3. Get FCM token using MODULAR SDK correctly
    const swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg || undefined,
    });

    if (token) {
      console.log("FCM token obtained:", token.slice(0, 20) + "...");
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
}

export function setBackgroundMessageHandler() {
  console.log("Background message handler is in firebase-messaging-sw.js");
}