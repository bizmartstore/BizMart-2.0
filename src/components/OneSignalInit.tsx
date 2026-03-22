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

    // Load OneSignal SDK
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = () => {
      console.log("[OneSignal] SDK loaded");
      window.OneSignal = window.OneSignal || [];

      window.OneSignal.push(async () => {
        try {
          // Initialize OneSignal
          await window.OneSignal.init({
            appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
          });
          console.log("[OneSignal] Initialized");

          // Wait for OneSignal internal user ID to be ready
          const oneSignalUserId = await window.OneSignal.getUserId();
          console.log("[OneSignal] OneSignal User ID:", oneSignalUserId);

          // Check if push is enabled
          let isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
          console.log("[OneSignal] Subscribed?", isSubscribed);

          // If not subscribed yet, prompt user
          if (!isSubscribed) {
            console.log("[OneSignal] Prompting user for push...");
            await window.OneSignal.showSlidedownPrompt();
            isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
            console.log("[OneSignal] Subscribed after prompt?", isSubscribed);
          }

          // ✅ If subscribed and user exists, set External ID
          if (isSubscribed && user?.id) {
            await window.OneSignal.setExternalUserId(user.id.toString());
            console.log("[OneSignal] External ID set:", user.id);

            // Add role tag if admin
            if (user.role === "admin") {
              await window.OneSignal.sendTags({ role: "admin" });
              console.log("[OneSignal] Admin tag set");
            }
          } else {
            console.log("[OneSignal] User not subscribed or missing user ID, skipping External ID");
          }
        } catch (err) {
          console.error("[OneSignal] Init error:", err);
        }
      });
    };

    document.head.appendChild(script);
  }, [user]);

  return null;
}