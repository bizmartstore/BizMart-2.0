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

    async function cleanupOldWorkers() {
      if (!("serviceWorker" in navigator)) return;
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const urls = [
          reg.active?.scriptURL,
          reg.waiting?.scriptURL,
          reg.installing?.scriptURL,
        ].filter(Boolean) as string[];
        const hasOldSw = urls.some((url) => url.includes("/sw.js"));
        if (hasOldSw) {
          await reg.unregister();
          console.log("[OneSignal] Old service worker unregistered:", urls);
        }
      }
    }

    async function initOneSignal() {
      try {
        await cleanupOldWorkers();

        if (!("OneSignal" in window)) {
          console.warn("[OneSignal] SDK not loaded yet, waiting...");
          return;
        }

        const OneSignal = (window as any).OneSignal || [];
        OneSignal.push(() => {
          OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: false }, // We use our own banner
            serviceWorkerPath: "/OneSignalSDKWorker.js",
            serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
          });
          console.log("[OneSignal] Initialized with ID:", appId);
          setOneSignalReady(true);
        });
      } catch (err) {
        console.error("[OneSignal] Initialization failed:", err);
      }
    }

    initOneSignal();
  }, [appId]);

  return oneSignalReady ? <NotificationPromptBanner /> : null;
}