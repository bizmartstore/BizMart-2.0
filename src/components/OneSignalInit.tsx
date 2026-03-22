import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext"; // adjust path

declare global {
  interface Window {
    OneSignal: any;
  }
}

export default function OneSignalInit() {
  const { user } = useAuth(); // logged-in user
  const initAttempted = useRef(false);

  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    // Load OneSignal SDK
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = () => {
      console.log("[OneSignal] SDK loaded");

      // Ensure OneSignal exists and push commands
      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(() => {
        try {
          // Initialize SDK
          window.OneSignal.init({
            appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            autoRegister: false, // prevent auto-subscribe
          });

          console.log("[OneSignal] SDK initialized");

          // Prompt user to subscribe if not already
          window.OneSignal.isPushNotificationsEnabled((enabled: boolean) => {
            if (!enabled) {
              window.OneSignal.showSlidedownPrompt(); // Show subscription prompt
            }
          });

          // Set external user ID **after subscription**
          window.OneSignal.on("subscriptionChange", (isSubscribed: boolean) => {
            if (isSubscribed && user?.id) {
              window.OneSignal.setExternalUserId(
                user.id.toString(),
                () => console.log("[OneSignal] ExternalUserId set:", user.id),
                (err: any) => console.error("[OneSignal] Failed to set ExternalUserId:", err)
              );
            }
          });

          // Set admin tag immediately if user is admin
          if (user?.role === "admin") {
            window.OneSignal.sendTags(
              { role: user.role },
              () => console.log("[OneSignal] Admin tag set:", user.role),
              (err: any) => console.error("[OneSignal] Failed to set tag:", err)
            );
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