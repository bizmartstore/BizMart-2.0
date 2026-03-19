/**
 * Unified Service Worker for BizMart
 * This file must be at the root /sw.js
 */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// The browser requires this file to be present and valid for PWA installation
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});