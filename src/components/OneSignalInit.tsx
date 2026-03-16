import { useEffect, useState } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";
import { useAuth } from "@/context/AuthContext";

export default function OneSignalInit() {
  const { user } = useAuth();
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let cleanupWorkers: (() => void) | null = null;

    async function cleanupOldWorkers() {
      if (!("serviceWorker" in navigator)) return;

      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          const urls = [
            reg.active?.scriptURL,
            reg.waiting?.scriptURL,
            reg.installing?.scriptURL,
          ].filter(Boolean) as string[];

          // Unregister any old OneSignal or custom SW that might conflict
          const shouldUnregister = urls.some(
            (url) =>
              url.includes("OneSignal") ||
              url.includes("/sw.js") ||
              url.includes("workbox")
          );

          if (shouldUnregister) {
            await reg.unregister();
            console.log("Unregistered old service worker:", urls);
          }
        }
      } catch (err) {
        console.warn("Service worker cleanup error:", err);
      }
    }

    async function initOneSignal() {
      if (!mounted) return;

      await cleanupOldWorkers();

      // Wait for OneSignal to be available
      const waitForOneSignal = () => {
        return new Promise<void>((resolve) => {
          if (window.OneSignal) {
            resolve();
            return;
          }

          const checkInterval = setInterval(() => {
            if (window.OneSignal) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);

          // Timeout after 10 seconds          setTimeout(() => {
            clearInterval(checkInterval);
            console.warn("OneSignal SDK not loaded after 10 seconds");
          }, 10000);
        });
      };

      try {
        await waitForOneSignal();

        const OneSignal = window.OneSignal;

        // Prevent double initialization
        if ((OneSignal as any)._initialized) {
          console.log("OneSignal already initialized, skipping...");
          if (mounted) setOneSignalReady(true);
          return;
        }

        // Initialize OneSignal
        OneSignal.push(() => {
          if (!mounted) return;

          try {
            OneSignal.init({
              appId: "617c000e-3cf8-4077-b083-9b4fea4018de",
              allowLocalhostAsSecureOrigin: true,
              notifyButton: {
                enable: true,
              },
              // Use the correct service worker paths
              serviceWorkerPath: "/OneSignalSDKWorker.js",
              serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
            });

            (OneSignal as any)._initialized = true;
            console.log("OneSignal initialized successfully");

            // Set External ID if user is logged in
            if (user?.id && typeof OneSignal.login === "function") {
              OneSignal.login(user.id).then(() => {
                console.log(`OneSignal: Set External ID to ${user.id}`);
              }).catch((err: any) => {
                console.warn("OneSignal login failed:", err);
              }
            }

            if (mounted) setOneSignalReady(true);
          } catch (err) {
            console.error("OneSignal init error:", err);
            if (mounted) setOneSignalReady(true); // Still mark as ready to show app          }
        });
      } catch (err) {
        console.error("OneSignal setup failed:", err);
        if (mounted) setOneSignalReady(true);
      }
    }

    initOneSignal();

    return () => {
      mounted = false;
      if (cleanupWorkers) cleanupWorkers();
    };
  }, [user]);

  return oneSignalReady ? <NotificationPromptBanner /> : null;
}