import { useEffect, useRef, useState } from "react";

export default function OneSignalInit() {
  const [isReady, setIsReady] = useState(false);
  const initAttempted = useRef(false);
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  useEffect(() => {
    if (initAttempted.current || !appId) return;
    initAttempted.current = true;

    // Check if OneSignal is already loaded and initialized
    if (window.OneSignal && window.OneSignal.initialized) {
      console.log("[OneSignal] Already initialized, skipping...");
      setIsReady(true);
      return;
    }

    // Load OneSignal SDK if not present
    if (!window.OneSignal) {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.async = true;
      script.onload = () => {
        console.log("[OneSignal] SDK loaded from dynamic script");
        initOneSignal();
      };
      script.onerror = () => {
        console.error("[OneSignal] Failed to load SDK");
      };
      document.head.appendChild(script);
    } else {
      initOneSignal();
    }

    function initOneSignal() {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          // Check again if already initialized (race condition)
          if (OneSignal.initialized) {
            console.log("[OneSignal] Already initialized (deferred), skipping...");
            setIsReady(true);
            return;
          }

          await OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
            serviceWorkerPath: "/OneSignalSDKWorker.js",
            serviceWorkerParam: { scope: "/" },
            notifyButton: { enable: false },
            // Important for mobile browsers
            promptOptions: {
              slidedown: {
                enabled: true,
                actionMessage: "Enable notifications to get order updates and messages!",
                autoAccept: false,
                text: "Allow",
                cancelText: "No thanks"
              }
            }
          });

          setIsReady(true);
          console.log("[OneSignal] Initialized successfully");
          
          // Set up subscription change listener
          OneSignal.User.push.addEventListener('change', (event: any) => {
            console.log('[OneSignal] Subscription changed:', event);
            if (event.to?.status === 'subscribed') {
              console.log('[OneSignal] User subscribed');
            }
          });
        } catch (error) {
          console.error("[OneSignal] Init Error:", error);
          // Fallback: try to login with anonymous ID
          try {
            await OneSignal.login(`anon_${Date.now()}_${Math.random().toString(36).slice(2)}`);
            setIsReady(true);
          } catch (e) {
            console.error("[OneSignal] Fallback login failed:", e);
          }
        }
      });
    }
  }, [appId]);

  return null; // This component doesn't render anything
}