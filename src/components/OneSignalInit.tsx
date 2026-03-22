import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext"; // Assuming you have an auth context

declare global {
  interface Window { OneSignal: any; }
}

export default function OneSignalInit() {
  const initAttempted = useRef(false);
  const { user } = useAuth(); // Your logged-in user

  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    // Load SDK script
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;
    script.onload = () => {
      console.log("[OneSignal] SDK loaded");

      // Push all commands to queue to guarantee SDK readiness
      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(() => {
        try {
          // Initialize
          window.OneSignal.init({
            appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            autoRegister: false, // prevent auto-subscribe
          });

          // If user exists, set external user ID
          if (user?.id) {
            window.OneSignal.setExternalUserId(user.id.toString());
            console.log("[OneSignal] ExternalUserId set:", user.id);
          }
        } catch (err) {
          console.error("[OneSignal] Init error:", err);
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