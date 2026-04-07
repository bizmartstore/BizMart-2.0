import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { getMessaging, onMessage } from "firebase/messaging";

clientsClaim();
precacheAndRoute(self.__WB_MANIFEST || []);

// Handle incoming FCM messages
onMessage(getMessaging(), (payload) => {
  console.log('FCM message received in SW:', payload);
  // Extract data
  const data = payload.data;
  const { title, message, type, userId, icon } = data;
  // Show notification
  self.registration.showNotification({
    title: title || 'New Notification',
    body: message || '',
    icon: icon,
    data: { type, userId }
  });
  // Optionally, forward to background sync or other logic
});

// Register route for static assets (already handled by VitePWA)
registerRoute(
  ({ request }) => request.destination === "script",
  new Response("fallback script", { headers: { "Content-Type": "application/javascript" })
);