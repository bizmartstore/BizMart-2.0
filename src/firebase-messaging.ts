import { messaging, isSupported } from "./firebase";

export async function requestUserPermission() {
  try {
    // Check if Firebase Messaging is supported
    const supported = await isSupported();
    if (!supported) {
      console.warn("Firebase Messaging is not supported in this browser");
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return null;
    }

    // Get FCM token using the correct Service Worker registration API
    const swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    const token = await (messaging as any).getToken({
      vapidKey: "BLiQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE",
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      console.log("FCM token obtained:", token.slice(0, 20) + "...");
      return token;
    } else {
      console.warn("No FCM token received");
      return null;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
}

export function setBackgroundMessageHandler() {
  // This is handled by the service worker in /public/firebase-messaging-sw.js
  console.log("Background message handler is in firebase-messaging-sw.js");
}