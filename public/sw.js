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
  event.waitUntil(clients.claim());
});