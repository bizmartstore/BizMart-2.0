import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext"; // Your auth context

declare global {
  interface Window { OneSignal: any; }
}

export default function OneSignalInit() {
  const initAttempted = useRef(false);
  const { user } = useAuth();

  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    // Load OneSignal SDK
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = () => {
      console.log("[OneSignal] SDK loaded");

      // Ensure OneSignal is defined
      window.OneSignal = window.OneSignal || [];

      // Initialize OneSignal safely
      window.OneSignal.push(() => {
        if (window.OneSignal.initialized) {
          console.log("[OneSignal] Already initialized");
          return;
        }

        window.OneSignal.init({
          appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          autoRegister: false, // prevent auto-subscribe
        });

        window.OneSignal.initialized = true;

        console.log("[OneSignal] Initialized");

        // Set external user ID if user exists
        if (user?.id) {
          window.OneSignal.setExternalUserId(user.id.toString(), () => {
            console.log("[OneSignal] ExternalUserId set:", user.id);
          }, (err: any) => {
            console.error("[OneSignal] Failed to set ExternalUserId:", err);
          });
        }
      });
    };

    script.onerror = () => console.error("[OneSignal] SDK load error");

    document.head.appendChild(script);

    return () => {
      // Optional cleanup if needed
      document.head.removeChild(script);
    };
  }, [user]);

  return null;
}