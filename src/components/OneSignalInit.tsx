import { useEffect, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

export default function OneSignalInit() {
  const [oneSignalReady, setOneSignalReady] = useState(false);
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  useEffect(() => {
    if (!appId) {
      console.error("[OneSignal] App ID is missing! Check VITE_ONESIGNAL_APP_ID.");
      return;
    }

    async function initOneSignal() {
      try {
        if (!("OneSignal" in window)) {
          console.warn("[OneSignal] SDK not loaded yet, waiting...");
          return;
        }

        const OneSignal = (window as any).OneSignal || [];
        
        OneSignal.push(async () => {
          await OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: false },
            serviceWorkerPath: "/OneSignalSDKWorker.js",
            serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
          });
          
          console.log("[OneSignal] Initialized successfully with ID:", appId);
          setOneSignalReady(true);

          // Check permission and show prompt if needed after a short delay
          const permission = await OneSignal.Notifications.permission;
          console.log("[OneSignal] Current permission status:", permission);
          
          if (permission === "default") {
            setTimeout(() => {
              console.log("[OneSignal] Triggering slidedown prompt...");
              OneSignal.Slidedown.promptPush();
            }, 5000);
          }
        });
      } catch (err) {
        console.error("[OneSignal] Initialization failed:", err);
      }
    }

    initOneSignal();
  }, [appId]);

  return oneSignalReady ? <NotificationPromptBanner /> : null;
}