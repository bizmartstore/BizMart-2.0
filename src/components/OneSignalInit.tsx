import { useEffect, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

export default function OneSignalInit() {
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    async function unregisterOldSW() {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          if (reg.active?.scriptURL.endsWith("/sw.js")) {
            const success = await reg.unregister();
            if (success) console.log("Old SW /sw.js unregistered");
          }
        }
      }
    }

    async function initOneSignal() {
      try {
        if (!("OneSignal" in window)) {
          console.warn("OneSignal SDK not loaded yet");
          return;
        }

        const OneSignal = window.OneSignal || [];
        OneSignal.push(() => {
          // Only initialize once
          if (!OneSignal.initialized) {
            OneSignal.init({
              appId: "617c000e-3cf8-4077-b083-9b4fea4018de",
              allowLocalhostAsSecureOrigin: true,
              notifyButton: { enable: true },
            });
            OneSignal.initialized = true; // prevent multiple inits
            setOneSignalReady(true);
          }
        });
      } catch (err) {
        console.error("OneSignal initialization failed:", err);
      }
    }

    // Step 1: Remove old SWs
    unregisterOldSW().then(() => {
      // Step 2: Initialize OneSignal
      initOneSignal();
    });
  }, []);

  return oneSignalReady ? <NotificationPromptBanner /> : null;
}