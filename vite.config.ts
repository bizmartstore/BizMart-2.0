import { useEffect, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

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

        if (urls.some((url) => url.includes("/sw.js"))) {
          await reg.unregister();
          console.log("Old service worker unregistered:", urls);
        }
      }
    }

    async function initOneSignal() {
      try {
        await cleanupOldWorkers();

        if (!("OneSignal" in window)) {
          console.warn("OneSignal SDK not loaded yet");
          return;
        }

        // prevent multiple initializations
        if ((window as any)._oneSignalInitialized) return;
        (window as any)._oneSignalInitialized = true;

        const OneSignal = window.OneSignal || [];
        OneSignal.push(() => {
          OneSignal.init({
            appId: "617c000e-3cf8-4077-b083-9b4fea4018de",
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: true },
            serviceWorkerPath: "/OneSignalSDKWorker.js",
            serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
          });

          setOneSignalReady(true);
        });
      } catch (err) {
        console.error("OneSignal initialization failed:", err);
      }
    }

    initOneSignal();
  }, []);

  return oneSignalReady ? <NotificationPromptBanner /> : null;
}