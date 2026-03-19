import { useEffect, useRef, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

/**
 * OneSignalInit Component
 * Handles the lifecycle of OneSignal push notifications in a React environment.
 */
export default function OneSignalInit() {
  const [isReady, setIsReady] = useState(false);
  const initAttempted = useRef(false);
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  useEffect(() => {
    // 1. Prevent multiple initializations in React Strict Mode
    if (initAttempted.current || !appId) return;
    initAttempted.current = true;

    // 2. Use the deferred array to ensure commands run after SDK loads
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      console.log("[OneSignal] SDK detected, starting initialization...");

      try {
        // 3. Initialize with custom service worker path to avoid conflicts
        await OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "/sw.js", // Points to our unified worker
          serviceWorkerParam: { scope: "/" },
          notifyButton: { enable: false }, // We use our own custom UI
        });

        console.log("[OneSignal] Initialized successfully.");
        setIsReady(true);

        // 4. Check current permission and subscription status
        const permission = OneSignal.Notifications.permission;
        const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
        
        console.log("[OneSignal] Permission:", permission);
        console.log("[OneSignal] Subscribed:", isOptedIn);

        // 5. Handle "Unsubscribed" state if permission was already granted
        // This fixes cases where the user allowed notifications but the SDK lost the subscription
        if (permission === "granted" && !isOptedIn) {
          console.log("[OneSignal] Permission granted but not opted in. Syncing...");
          await OneSignal.User.PushSubscription.optIn();
        }

        // 6. Auto-show slidedown prompt for new users after a delay
        if (permission === "default") {
          setTimeout(() => {
            console.log("[OneSignal] Triggering slidedown prompt...");
            OneSignal.Slidedown.promptPush().catch((err: any) => {
              console.warn("[OneSignal] Slidedown failed:", err);
            });
          }, 5000);
        }
      } catch (error) {
        console.error("[OneSignal] Initialization error:", error);
      }
    });
  }, [appId]);

  // Only show the custom prompt banner once the SDK is actually ready
  return isReady ? <NotificationPromptBanner /> : null;
}