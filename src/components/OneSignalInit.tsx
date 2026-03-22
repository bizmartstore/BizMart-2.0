import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
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

    script.onload = async () => {
      console.log("[OneSignal] SDK loaded");

      // @ts-ignore - OneSignal is dynamically attached to window      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(async () => {
        try {
          await window.OneSignal.init({
            appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            autoRegister: false,
          });

          console.log("[OneSignal] SDK initialized");

          // Use getDevicePermission instead of deprecated getNotificationPermission          const permission = await window.OneSignal.getDevicePermission
            ? await window.OneSignal.getDevicePermission()
            : "granted"; // fallback for older versions

          if (permission !== "granted") {
            await window.OneSignal.getDevicePermission((permissionState) => {
              if (permissionState !== "granted") {
                window.OneSignal.showSlidedownPrompt();
              }
            });
          }

          // Set external user ID after permission check
          if (user?.id) {
            await window.OneSignal.setExternalUserId(user.id.toString());
            console.log("[OneSignal] ExternalUserId set:", user.id);
          }

          // Set admin tag if needed
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