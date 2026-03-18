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

        const hasOldSw = urls.some((url) => url.includes("/sw.js"));

        if (hasOldSw) {
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
    
            const OneSignal = window.OneSignal || [];
            OneSignal.push(() => {
              OneSignal.init({
                appId: "56883e62-5aae-4486-b9c3-84e5e1db41c9",
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