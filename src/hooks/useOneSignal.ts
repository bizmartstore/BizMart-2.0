"use client";

import { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    OneSignal?: any;
  }
}

/**
 * Wait for OneSignal SDK to be loaded and return the client.
 * Returns null until the SDK script has executed.
 */
export function useOneSignal() {
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    // Create the OneSignal SDK script element
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.js";
    script.async = true;
    document.head.appendChild(script);

    // When the script loads, initialize OneSignal
    script.onload = () => {
      const os = (window as any).OneSignal;
      if (os) {
        setClient(os);
        // Optional: initialise with your app ID here if you want auto-login etc.
      }
    };

    // Cleanup on unmount
    return () => {
      // No cleanup needed for the script tag
    };
  }, []);

  /**
   * Prompt the user for notification permission and tag them based on role.
   * This should be called after the client is ready.
   */
  export async function promptForPush() {
    if (!client) {
      console.warn("[OneSignal] SDK not ready yet");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Tag the user with role information for admin targeting
      const { role } = useAdmin(); // assuming you have a hook that gives role
      const roleTag = role === "main_admin" ? "main_admin" : "member_admin";
      await client.sendTag({ user_id: "anonymous" }, [roleTag]); // example tagging
    }
  }

  return client;
}