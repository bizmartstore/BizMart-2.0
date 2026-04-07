import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";

clientsClaim();
precacheAndRoute(self.__WB_MANIFEST || []);

import { getMessaging, onMessage } from "firebase/messaging";
onMessage(getMessaging(), (payload) => {
  console.log('FCM message received in SW:', payload);
  const data = payload.data;
  const { title, message, type, userId, icon } = data;
  self.registration.showNotification({
    title: title || "New Notification",
    body: message || "",
    icon: icon,
    data: { type, userId }
  });
});