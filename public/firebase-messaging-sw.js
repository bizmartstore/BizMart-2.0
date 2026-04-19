// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Firebase configuration (must match your Firebase project)
const firebaseConfig = {
  apiKey: "AIzaSyC8lS2_jwxlJfG41Ibdy1D__PDalIajf10",
  authDomain: "bizmart-aaf1b.firebaseapp.com",
  projectId: "bizmart-aaf1b",
  storageBucket: "bizmart-aaf1b.firebasestorage.app",
  messagingSenderId: "310239525651",
  appId: "1:310239525651:web:d65ab855cdef15919ab8e6",
  measurementId: "G-FP54T49NG5",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase Messaging instance
const messaging = firebase.messaging();

// Set the VAPID key (must match the one in Firebase Console)
messaging.useServiceWorker(self.registration);

// Request permission and get token
messaging.getToken({
  vapidKey: "BLIQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE",
})
  .then((currentToken) => {
    if (currentToken) {
      console.log("[firebase-messaging-sw.js] FCM Token:", currentToken);
      // Send the token to your server (e.g., via fetch or Supabase)
      fetch("/api/save-fcm-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: currentToken }),
      }).catch((err) => console.error("Failed to save token:", err));
    } else {
      console.log("[firebase-messaging-sw.js] No registration token available.");
    }
  })
  .catch((err) => {
    console.error("[firebase-messaging-sw.js] Error fetching FCM token:", err);
  });

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const title = payload.notification?.title || "New Notification";
  const body = payload.notification?.body || "You have a new notification";
  const icon = payload.notification?.icon || "/pwa-192x192.png";
  const link = payload.data?.link || "/";

  self.registration.showNotification(title, {
    body,
    icon,
    badge: "/pwa-192x192.png",
    data: { link },
  });
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.link || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

console.log("[firebase-messaging-sw.js] Service worker loaded");