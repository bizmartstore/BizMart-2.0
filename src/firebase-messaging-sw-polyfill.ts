// This file provides a polyfill for service worker registration
// The actual service worker is in /public/firebase-messaging-sw.js

export async function requestUserPermission() {
  try {
    // Check if Firebase Messaging is supported
    const { isSupported } = await import("./firebase");
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

    // Get FCM token
    const { messaging } = await import("./firebase");
    const token = await (messaging as any).getToken({
      vapidKey: "BLiQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE",
    });

    return token;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
}