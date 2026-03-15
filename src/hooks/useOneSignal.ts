"use client";

import { useState, useEffect } from "react";

declare global {
  interface Window {
    OneSignal?: any;
  }
}

/**
 * Hook to get the OneSignal client.
 * Returns the OneSignal client object when available, otherwise null.
 */
export function useOneSignal() {
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    // If OneSignal is already available, use it
    if (window.OneSignal) {
      setClient(window.OneSignal);
      return;
    }

    // Otherwise, load the script
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.js";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      const os = window.OneSignal;
      if (os) {
        setClient(os);
      }
    };

    return () => {
      // We don't remove the script because it might be used by other parts of the app
    };
  }, []);

  return client;
}