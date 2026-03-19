/**
 * Unified Service Worker for BizMart
 * This file must be at the root /sw.js
 */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Basic PWA requirements - must be top-level
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for OneSignal push notifications
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json();
  if (data) {
    // Custom handling can be added here if needed
    console.log('[Service Worker] Push received:', data);
  }
});

// Handle notificationclick event
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  // You can add custom focus logic here
  event.notification.showNotification(event.notification.title, {
    body: event.notification.body,
    icon: '/logo.png',
    badge: '/favicon.ico',
    data: event.notification.data,
  });
});