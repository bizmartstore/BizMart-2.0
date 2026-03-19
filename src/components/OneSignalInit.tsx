import { useEffect, useRef, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

export default function OneSignalInit() {
  const [isReady, setIsReady] = useState(false);
  const initAttempted = useRef(false);
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  useEffect(() => {
    if (initAttempted.current || !appId) return;
    initAttempted.current = true;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      if (OneSignal.initialized) {
        console.log("[OneSignal] Already initialized, skipping...");
        setIsReady(true);
        return;
      }

      try {
        await OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "/sw.js",
          serviceWorkerParam: { scope: "/" },
          notifyButton: { enable: false },
        });

        setIsReady(true);
        console.log("[OneSignal] Initialized successfully");
      } catch (error) {
        console.error("[OneSignal] Init Error:", error);
      }
    });
  }, [appId]);

  return isReady ? <NotificationPromptBanner /> : null;
}