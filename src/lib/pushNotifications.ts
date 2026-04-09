/**
 * Triggers a local push notification via the service worker.
 * This provides immediate feedback to the user on the current device.
 */
export async function triggerLocalPushNotification(title: string, body: string) {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return;
  }

  if (Notification.permission === "granted") {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      tag: 'order-confirmation',
      renotify: true
    } as any);
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      triggerLocalPushNotification(title, body);
    }
  }
}