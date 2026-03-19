import { useEffect, useState, useRef } from "react";
import NotificationPromptBanner from "./NotificationPromptBanner";

declare global {
  interface Window {
    OneSignalInitialized?: boolean;
  }
}

export default function OneSignalInit() {
  const [oneSignalReady, setOneSignalReady] = useState(false);
  const initStarted = useRef(false);
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  useEffect(() => {
    if (!appId || initStarted.current || window.OneSignalInitialized) return;
    initStarted.current = true;

    async function initOneSignal() {
      try {
        // 1. Check for IndexedDB (required by OneSignal)
        if (!window.indexedDB) {
          console.warn("[OneSignal] IndexedDB is unavailable. Notifications may not work in this environment.");
        }

        if (!("OneSignal" in window)) {
          console.warn("[OneSignal] SDK script not found in window.");
          return;
        }

        const OneSignal = (window as any).OneSignal || [];
        
        OneSignal.push(async () => {
          // 2. Prevent double initialization
          if (OneSignal.initialized) {
            console.log("[OneSignal] SDK already initialized, skipping init.");
            setOneSignalReady(true);
            return;
          }

          console.log("[OneSignal] Starting initialization with ID:", appId);
          
          await OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: false },
            serviceWorkerPath: "/OneSignalSDKWorker.js",
            serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
          });
          
          window.OneSignalInitialized = true;
          console.log("[OneSignal] Initialized successfully.");
          setOneSignalReady(true);

          // 3. Check permission and log status
          const permission = await OneSignal.Notifications.permission;
          console.log("[OneSignal] Current permission status:", permission);
          
          // 4. Auto-trigger slidedown after a delay if permission is default
          if (permission === "default") {
            setTimeout(() => {
              console.log("[OneSignal] Triggering automatic slidedown prompt...");
              OneSignal.Slidedown.promptPush().catch((e: any) => 
                console.warn("[OneSignal] Slidedown prompt failed:", e)
              );
            }, 8000);
          }
        });
      } catch (err) {
        console.error("[OneSignal] Initialization error:", err);
      }
    }

    initOneSignal();
  }, [appId]);

  return oneSignalReady ? <NotificationPromptBanner /> : null;
}