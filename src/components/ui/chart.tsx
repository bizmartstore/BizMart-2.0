import { useEffect, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

export default function OneSignalInit() {
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    async function initOneSignal() {
      if (!("OneSignal" in window)) return;

      const OneSignal = window.OneSignal;

      try {
        await OneSignal.init({
          appId: "617c000e-3cf8-4077-b083-9b4fea4018de",
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: true },
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
        });

        setOneSignalReady(true);
        console.log("[OneSignal] initialized");

      } catch (err) {
        console.error("[OneSignal] init failed:", err);
      }
    }

    initOneSignal();
  }, []);

  return oneSignalReady ? <NotificationPromptBanner /> : null;
}