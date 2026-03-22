import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext"; // adjust path

declare global {
  interface Window {
    OneSignal: any;
  }
}

export default function OneSignalInit() {
  const { user } = useAuth();
  const initAttempted = useRef(false);

  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

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
            autoRegister: false,
          });

          console.log("[OneSignal] SDK initialized");

          // Subscribe user manually if not already
          const isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
          if (!isSubscribed) {
            console.log("[OneSignal] User not subscribed yet, showing prompt...");
            window.OneSignal.showSlidedownPrompt();
          }

          // When subscription changes (user accepts prompt)
          window.OneSignal.on("subscriptionChange", async (subscribed: boolean) => {
            console.log("[OneSignal] subscriptionChange:", subscribed);
            if (subscribed && user?.id) {
              try {
                await window.OneSignal.setExternalUserId(user.id.toString());
                console.log("[OneSignal] ExternalUserId set after subscription:", user.id);
              } catch (err) {
                console.error("[OneSignal] Failed to set ExternalUserId:", err);
              }
            }
          });

          // If already subscribed, set external ID immediately
          if (isSubscribed && user?.id) {
            await window.OneSignal.setExternalUserId(user.id.toString());
            console.log("[OneSignal] ExternalUserId set immediately:", user.id);
          }

          // Admin tag
          if (user?.role === "admin") {
            await window.OneSignal.sendTags({ role: user.role });
            console.log("[OneSignal] Admin tag set:", user.role);
          }
        } catch (err) {
          console.error("[OneSignal] Init error:", err);
        }
      });
    };

    script.onerror = () => console.error("[OneSignal] SDK load error");
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [user]);

  return null;
}