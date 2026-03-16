import { useEffect, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";
import { useAuth } from "@/context/AuthContext";

export default function OneSignalInit() {
  const { user } = useAuth(); // your logged-in customer
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timer;

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
      await cleanupOldWorkers();

      const OneSignal = (window as any).OneSignal;
      if (!OneSignal) return;

      OneSignal.push(async () => {
        try {
          // Initialize SDK only once
          if (!(OneSignal as any)._initialized) {
            OneSignal.init({
              appId: "617c000e-3cf8-4077-b083-9b4fea4018de",
              allowLocalhostAsSecureOrigin: true,
              notifyButton: { enable: true },
              serviceWorkerPath: "/OneSignalSDKWorker.js",
              serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
            });
            (OneSignal as any)._initialized = true;
          }

          // If user is logged in, set External ID
          if (user?.id && typeof OneSignal.login === "function") {
            await OneSignal.login(user.id);
            console.log(`[OneSignal] Logged in user ${user.id}`);
          }

          // Prompt permission if not yet granted
          if (OneSignal.Notifications?.permission === "default") {
            await OneSignal.Notifications.requestPermission();
          }

          setOneSignalReady(true);
        } catch (err) {
          console.error("OneSignal setup failed:", err);
        }
      });
    }

    // Wait until SDK loads
    interval = setInterval(() => {
      if ("OneSignal" in window) {
        clearInterval(interval);
        initOneSignal();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [user]);

  return oneSignalReady ? <NotificationPromptBanner /> : null;
}