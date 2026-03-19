import { useEffect, useState, useRef } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

declare global {
  interface Window {
    OneSignalInitialized?: boolean;
  }
}

export default function OneSignalInit() {
  const [oneSignalReady, setOneSignalReady] = useState(false);
  const initStarted = useRef(false);
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  useEffect(() => {
    if (!appId || initStarted.current || window.OneSignalInitialized) return;
    initStarted.current = true;

    async function initOneSignal() {
      try {
        if (!("OneSignal" in window)) {
          console.warn("[OneSignal] SDK not found.");
          return;
        }

        const OneSignal = (window as any).OneSignal || [];

        OneSignal.push(async () => {
          if (window.OneSignalInitialized) {
            console.log("[OneSignal] Already initialized.");
            setOneSignalReady(true);
            return;
          }

          console.log("[OneSignal] Initializing with App ID:", appId);

          await OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: false },

            // ✅ USE YOUR EXISTING SERVICE WORKER
            serviceWorkerPath: "/sw.js",
            serviceWorkerParam: { scope: "/" },
          });

          window.OneSignalInitialized = true;
          setOneSignalReady(true);

          console.log("[OneSignal] Initialized successfully.");

          // ✅ CHECK PERMISSION
          const permission = OneSignal.Notifications.permission;
          console.log("[OneSignal] Permission:", permission);

          // ✅ CHECK SUBSCRIPTION
          const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
          console.log("[OneSignal] Subscribed:", isSubscribed);

          // 🔥 AUTO PROMPT ONLY IF NOT DECIDED
          if (permission === "default") {
            setTimeout(() => {
              console.log("[OneSignal] Showing prompt...");
              OneSignal.Slidedown.promptPush().catch((err: any) => {
                console.warn("[OneSignal] Prompt error:", err);
              });
            }, 5000);
          }

          // 🔥 FORCE RESUBSCRIBE IF UNSUBSCRIBED
          if (!isSubscribed && permission === "granted") {
            console.log("[OneSignal] Re-subscribing user...");
            await OneSignal.User.PushSubscription.optIn();
          }
        });
      } catch (err) {
        console.error("[OneSignal] Init error:", err);
      }
    }

    initOneSignal();
  }, [appId]);

  return oneSignalReady ? <NotificationPromptBanner /> : null;
}