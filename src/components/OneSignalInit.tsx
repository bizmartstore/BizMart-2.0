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

  // ✅ LOAD + INIT ONCE
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = () => {
      console.log("[OneSignal] SDK loaded");

      window.OneSignal = window.OneSignal || [];

      window.OneSignal.push(async () => {
        try {
          await window.OneSignal.init({
            appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
          });

          console.log("[OneSignal] Initialized");

          // ✅ Ask permission if not subscribed
          const optedIn =
            await window.OneSignal.User.PushSubscription.getOptedIn();

          if (!optedIn) {
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

  // ✅ LOGIN USER (SEPARATE EFFECT)
  useEffect(() => {
    if (!user?.id || !window.OneSignal) return;

    window.OneSignal.push(async () => {
      try {
        // ✅ Ensure user is subscribed first
        const optedIn =
          await window.OneSignal.User.PushSubscription.getOptedIn();

        if (!optedIn) {
          console.log("[OneSignal] Not subscribed yet, skipping login");
          return;
        }

        // ✅ NEW METHOD (v16)
        await window.OneSignal.login(user.id.toString());

        console.log("[OneSignal] External ID set:", user.id);

        // ✅ TAGS
        if (user.role === "admin") {
          await window.OneSignal.User.addTag("role", "admin");
          console.log("[OneSignal] Admin tag set");
        }

      } catch (err) {
        console.error("[OneSignal] Login error:", err);
      }
    });
  }, [user]);

  return null;
}