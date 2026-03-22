importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// This service worker is specifically for OneSignal push notifications
// All event listeners are registered at the top level as required by OneSignal v16

self.addEventListener('install', (event) => {
  console.log('[OneSignal SW] Installing service worker');
});

self.addEventListener('activate', (event) => {
  console.log('[OneSignal SW] Activating service worker');
});

self.addEventListener('message', (event) => {
  // Required by OneSignal - must be at top level
  if (event.data && event.data.type === 'ONESIGNAL_PUSH_NOTIFICATION_CLICK') {
    console.log('[OneSignal SW] Notification click received');
  }
});