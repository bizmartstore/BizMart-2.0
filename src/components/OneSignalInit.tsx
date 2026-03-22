// OneSignalInit.tsx
import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

declare global {
  interface Window {
    OneSignal: any;
  }
}

export default function OneSignalInit() {
  const { user } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = () => {
      console.log("[OneSignal] SDK loaded");
      window.OneSignal = window.OneSignal || [];

      const setupOneSignal = async () => {
        try {
          await window.OneSignal.init({
            appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
          });
          console.log("[OneSignal] Initialized");

          // Wait until both OneSignal User ID and Supabase user are ready
          let oneSignalUserId = null;
          for (let i = 0; i < 10; i++) { // try 10 times
            oneSignalUserId = await window.OneSignal.getUserId();
            if (oneSignalUserId && user?.id) break;
            await new Promise((res) => setTimeout(res, 300)); // wait 300ms
          }
          console.log("[OneSignal] OneSignal User ID:", oneSignalUserId);

          // Check if push is enabled
          let isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
          console.log("[OneSignal] Subscribed?", isSubscribed);

          if (!isSubscribed) {
            console.log("[OneSignal] Prompting user for push...");
            await window.OneSignal.showSlidedownPrompt();
            isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
            console.log("[OneSignal] Subscribed after prompt?", isSubscribed);
          }

          if (isSubscribed && oneSignalUserId && user?.id) {
            await window.OneSignal.setExternalUserId(user.id.toString());
            console.log("[OneSignal] External ID set:", user.id);

            if (user.role === "admin") {
              await window.OneSignal.sendTags({ role: "admin" });
              console.log("[OneSignal] Admin tag set");
            }
          } else {
            console.log("[OneSignal] Cannot set External ID — waiting failed or user not subscribed");
          }
        } catch (err) {
          console.error("[OneSignal] Setup error:", err);
        }
      };

      window.OneSignal.push(setupOneSignal);
    };

    document.head.appendChild(script);
  }, [user]);

  return null;
}