// firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC8lS2_jwxlJfG41Ibdy1D__PDalIajf10",
  authDomain: "bizmart-aaf1b.firebaseapp.com",
  projectId: "bizmart-aaf1b",
  messagingSenderId: "310239525651",
  appId: "1:310239525651:web:d65ab855cdef15919ab8e6",
});

const messaging = firebase.messaging();

// ✅ HANDLE ALL PUSH (background + closed)
messaging.onBackgroundMessage((payload) => {
  console.log("[FCM] Background message:", payload);

  const title = payload.notification?.title || "BizMart";

  const options = {
    body: payload.notification?.body || "",

    // ✅ FORCE YOUR LOGO (no more bell)
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",

    // Optional enhancements
    image: payload.notification?.image || undefined,
    tag: payload.data?.tag || "default", // prevents stacking duplicates
    renotify: true,

    data: {
      link: payload.data?.link || "/",
    },
  };

  self.registration.showNotification(title, options);
});

// ✅ CLICK HANDLER
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.link || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

console.log("[firebase-messaging-sw.js] Loaded");