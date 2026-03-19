import { useEffect, useRef, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

/**
 * OneSignalInit handles the push notification lifecycle.
 * It ensures the SDK is initialized exactly once and manages service worker paths.
 */
export default function OneSignalInit() {
  const [isReady, setIsReady] = useState(false);
  const initAttempted = useRef(false);
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  useEffect(() => {
    // 1. Prevent multiple initialization attempts (Strict Mode safe)
    if (initAttempted.current || !appId) return;
    initAttempted.current = true;

    // 3. Push initialization logic to the deferred queue
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      
      // 4. Check if already initialized to prevent "SDK already initialized" error
      if (OneSignal.initialized) {
        console.log("[OneSignal] SDK already initialized, skipping...");
        setIsReady(true);
        return;
      }

      console.log("[OneSignal] Initializing with App ID:", appId);

      try {
        await OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: true,
          // 5. Point to our unified service worker to avoid conflicts
          serviceWorkerPath: "/sw.js",
          serviceWorkerParam: { scope: "/" },
          notifyButton: { enable: false }, // Using custom UI instead
        });

        console.log("[OneSignal] Initialized successfully.");
        setIsReady(true);

        // 6. Sync subscription status
        const permission = OneSignal.Notifications.permission;
        const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
        
        console.log("[OneSignal] Permission:", permission);
        console.log("[OneSignal] Subscribed:", isOptedIn);

        // 7. Fix "Unsubscribed" state if browser permission is already granted
        if (permission === "granted" && !isOptedIn) {
          console.log("[OneSignal] Permission granted but user unsubscribed. Re-syncing...");
          await OneSignal.User.PushSubscription.optIn();
        }

        // 8. Auto-prompt for new users after a short delay
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

  // Only show the custom prompt banner once the SDK is ready
  return isReady ? <NotificationPromptBanner /> : null;
}