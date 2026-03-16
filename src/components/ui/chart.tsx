import { useEffect, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

export default function OneSignalInit() {
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
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
          console.log("Old service worker unregistered:", urls);
        }
      }
    }

    cleanupOldWorkers();

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        await OneSignal.init({
          appId: "617c000e-3cf8-4077-b083-9b4fea4018de",
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: true },
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
        });

        console.log("[OneSignal] Initialized successfully");
        setOneSignalReady(true);
      } catch (err) {
        console.error("OneSignal initialization failed:", err);
      }
    });
  }, []);

  return oneSignalReady ? <NotificationPromptBanner /> : null;
}