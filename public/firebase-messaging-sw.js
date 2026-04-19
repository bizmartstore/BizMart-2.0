// firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSy...",
  authDomain: "bizmart-aaf1b.firebaseapp.com",
  projectId: "bizmart-aaf1b",
  messagingSenderId: "310239525651",
  appId: "1:310239525651:web:d65ab855cdef15919ab8e6",
});

const messaging = firebase.messaging();

// ✅ Background messages ONLY
messaging.onBackgroundMessage((payload) => {
  console.log("[FCM] Background message:", payload);

  const title = payload.notification?.title || "New Notification";

  const options = {
    body: payload.notification?.body || "",
    icon: payload.notification?.icon || "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: {
      link: payload.data?.link || "/",
    },
  };

  self.registration.showNotification(title, options);
});

// ✅ Click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.link || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

console.log("[firebase-messaging-sw.js] Loaded");