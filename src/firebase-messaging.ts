import { isSupported, getToken } from "firebase/messaging";
import { messaging, VAPID_KEY } from "./firebase";

export async function requestUserPermission() {
  try {
    // 1. Browser safety checks
    if (!('serviceWorker' in navigator)) {
      console.warn("[FCM] Service Worker not supported");
      return null;
    }
    if (!('PushManager' in window)) {
      console.warn("[FCM] PushManager not supported");
      return null;
    }
    if (!('Notification' in window)) {
      console.warn("[FCM] Notifications not supported");
      return null;
    }

    // 2. Check Firebase support
    const supported = await isSupported();
    if (!supported) {
      console.warn("[FCM] Firebase Messaging not supported in this browser");
      return null;
    }

    // 3. Register Service Worker FIRST (or get existing)
    let swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!swReg) {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    }
    console.log("[FCM] Service Worker ready:", swReg.scope);

    // 4. Request browser permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Notification permission not granted");
      return null;
    }

    // 5. Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    } as any);

    if (token) {
      console.log("[FCM] Token obtained:", token.slice(0, 20) + "...");
      return token;
    }
    return null;
  } catch (error: any) {
    console.error("[FCM] Error requesting permission/token:", error);
    // Gracefully handle IndexedDB/Abort errors
    if (error?.code === 'messaging/failed-service-worker-registration' || 
        error?.message?.includes('AbortError') ||
        error?.message?.includes('IndexedDB')) {
      console.warn("[FCM] SW/IDB issue, falling back to silent failure");
    }
    return null;
  }
}

export function setBackgroundMessageHandler() {
  console.log("Background message handler is in firebase-messaging-sw.js");
}