import { useEffect, useRef, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

/**
 * OneSignalInit handles the push notification lifecycle.
 * Optimized for mobile by using a custom banner to satisfy user gesture requirements.
 */
export default function OneSignalInit() {
  const [isReady, setIsReady] = useState(false);
  const initAttempted = useRef(false);
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  useEffect(() => {
    // 1. Prevent multiple initialization attempts (Strict Mode safe)
    if (initAttempted.current || !appId) return;
    initAttempted.current = true;

    // 2. Queue initialization in the deferred array
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      
      // 3. Check if already initialized to prevent "SDK already initialized" error
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
          // 4. Use unified service worker to prevent registration conflicts
          serviceWorkerPath: "/sw.js",
          serviceWorkerParam: { scope: "/" },
          notifyButton: { enable: false }, // We use our own custom banner for better mobile support
        });

        console.log("[OneSignal] Initialized successfully.");
        
        // 5. Sync subscription status
        const permission = OneSignal.Notifications.permission;
        const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
        
        console.log("[OneSignal] Permission:", permission);
        console.log("[OneSignal] Subscribed:", isOptedIn);

        // 6. Fix "Unsubscribed" state if browser permission is already granted
        // This is crucial for users who might have been dropped from the OneSignal database
        if (permission === "granted" && !isOptedIn) {
          console.log("[OneSignal] Permission granted but user unsubscribed. Re-syncing...");
          await OneSignal.User.PushSubscription.optIn();
        }

        // 7. Signal that the SDK is ready so the Prompt Banner can show up
        setIsReady(true);

        // 8. Optional: Auto-prompt with Slidedown on Desktop only
        // Mobile is better handled by the user clicking the banner
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (permission === "default" && !isMobile) {
          setTimeout(() => {
            console.log("[OneSignal] Auto-triggering slidedown for desktop...");
            OneSignal.Slidedown.promptPush().catch(() => {});
          }, 10000);
        }
      } catch (error) {
        console.error("[OneSignal] Initialization error:", error);
      }
    });
  }, [appId]);

  // The banner provides the "User Gesture" (click) needed to trigger prompts on mobile
  return isReady ? <NotificationPromptBanner /> : null;
}