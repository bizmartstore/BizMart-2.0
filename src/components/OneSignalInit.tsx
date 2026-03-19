import { useEffect, useRef, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

export default function OneSignalInit() {
  const [isReady, setIsReady] = useState(false);
  const initAttempted = useRef(false);
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  useEffect(() => {
    if (initAttempted.current || !appId) return;
    initAttempted.current = true;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      
      if (OneSignal.initialized) {
        setIsReady(true);
        return;
      }

      try {
        await OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: true,
          // Use absolute path to ensure it works from any sub-page
          serviceWorkerPath: "/sw.js", 
          serviceWorkerParam: { scope: "/" },
          notifyButton: { enable: false },
        });

        const permission = OneSignal.Notifications.permission;
        const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
        
        // Repair logic: If permission is granted but subscription is missing, force a re-opt-in
        if (permission === "granted" && !isOptedIn) {
          console.log("[OneSignal] Repairing mobile subscription...");
          await OneSignal.User.PushSubscription.optIn();
        }

        setIsReady(true);

        // Auto-prompt for desktop only (mobile requires the banner click)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (permission === "default" && !isMobile) {
          setTimeout(() => {
            OneSignal.Slidedown.promptPush().catch(() => {});
          }, 5000);
        }
      } catch (error) {
        console.error("[OneSignal] Init Error:", error);
      }
    });
  }, [appId]);

  return isReady ? <NotificationPromptBanner /> : null;
}