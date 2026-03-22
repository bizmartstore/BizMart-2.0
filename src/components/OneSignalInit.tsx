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
          // ✅ Initialize OneSignal
          await window.OneSignal.init({
            appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
          });

          console.log("[OneSignal] Initialized");

          // ✅ Check if user is already subscribed
          const isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
          console.log("[OneSignal] Subscribed?", isSubscribed);

          if (!isSubscribed) {
            console.log("[OneSignal] Showing prompt...");
            await window.OneSignal.showSlidedownPrompt();
          }
        } catch (err) {
          console.error("[OneSignal] Init error:", err);
        }
      });
    };

    document.head.appendChild(script);
  }, []);

  // Handle login & External ID when user info is available
  useEffect(() => {
    if (!user?.id || !window.OneSignal) return;

    window.OneSignal.push(async () => {
      try {
        const isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
        if (!isSubscribed) {
          console.log("[OneSignal] User not subscribed, skipping External ID login");
          return;
        }

        // ✅ Set External User ID (replaces login)
        await window.OneSignal.setExternalUserId(user.id.toString());
        console.log("[OneSignal] External ID set:", user.id);

        // ✅ Add tags (v16)
        if (user.role === "admin") {
          await window.OneSignal.sendTags({ role: "admin" });
          console.log("[OneSignal] Admin tag set");
        }
      } catch (err) {
        console.error("[OneSignal] Login error:", err);
      }
    });
  }, [user]);

  return null;
}