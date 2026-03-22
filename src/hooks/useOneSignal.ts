import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    OneSignal: any;
  }
}

export function useOneSignal(user?: { id?: string; role?: string }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const initialized = useRef(false);

  // -------------------------------
  // ✅ LOAD + INIT ONE ONCE
  // -------------------------------
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = () => {
      console.log("[OneSignal] SDK loaded");
      window.OneSignal = window.OneSignal || [];

      window.OneSignal.push(async () => {
        try {
          await window.OneSignal.init({
            appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            autoRegister: false, // do NOT auto-register
          });

          console.log("[OneSignal] Initialized");
          setIsInitialized(true);

          // -------------------------------
          // ✅ CHECK SUBSCRIPTION
          // -------------------------------
          const permission = await window.OneSignal.Notifications.permission;
          const subscribed = permission === "granted";
          setIsSubscribed(subscribed);

          if (!subscribed) {
            console.log("[OneSignal] Prompting user for push...");
            await window.OneSignal.Notifications.requestPermission();
            const newPermission = await window.OneSignal.Notifications.permission;
            setIsSubscribed(newPermission === "granted");
          }
        } catch (err) {
          console.error("[OneSignal] Init error:", err);
        }
      });
    };

    script.onerror = () => console.error("[OneSignal] SDK load error");

    document.head.appendChild(script);
  }, []);

  // -------------------------------
  // ✅ HANDLE LOGIN / EXTERNAL ID
  // -------------------------------
  useEffect(() => {
    if (!isInitialized || !user?.id || !window.OneSignal) return;

    window.OneSignal.push(async () => {
      try {
        const permission = await window.OneSignal.Notifications.permission;
        if (permission !== "granted") {
          console.log("[OneSignal] User not subscribed, skipping login");
          return;
        }

        await window.OneSignal.login(user.id.toString());
        console.log("[OneSignal] External ID set:", user.id);

        if (user.role) {
          await window.OneSignal.User.addTag("role", user.role);
          console.log("[OneSignal] Role tag set:", user.role);
        }
      } catch (err) {
        console.error("[OneSignal] Login error:", err);
      }
    });
  }, [user, isInitialized]);

  // -------------------------------
  // ✅ HANDLE LOGOUT
  // -------------------------------
  const logout = async () => {
    if (!window.OneSignal) return;
    await window.OneSignal.logout();
    console.log("[OneSignal] Logged out");
  };

  return {
    isInitialized,
    isSubscribed,
    logout,
  };
}