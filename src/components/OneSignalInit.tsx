import { useEffect, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

export default function OneSignalInit() {
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    async function initOneSignal() {
      try {
        if (!("OneSignal" in window)) {
          console.warn("OneSignal SDK not loaded yet");
          return;
        }

        const OneSignal = window.OneSignal || [];
        OneSignal.push(() => {
          OneSignal.init({
            appId: "617c000e-3cf8-4077-b083-9b4fea4018de",
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: true },
          });

          setOneSignalReady(true); // Safe to render banner now
        });
      } catch (err) {
        console.error("OneSignal initialization failed:", err);
      }
    }

    // Unregister old /sw.js before init
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => {
          if (reg.active?.scriptURL.endsWith("/sw.js")) {
            reg.unregister().then(() =>
              console.log("Old SW /sw.js unregistered")
            );
          }
        });
      });
    }

    initOneSignal();
  }, []);

  // Only render banner if OneSignal is ready
  return oneSignalReady ? <NotificationPromptBanner /> : null;
}