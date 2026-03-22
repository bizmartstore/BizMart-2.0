import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function OneSignalInit() {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const initAttempted = useRef(false);
  const oneSignalInitialized = useRef(false);

  // Load OneSignal script
  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;
    script.onload = () => {
      console.log("[OneSignal] SDK loaded");
      setIsReady(true);
    };
    script.onerror = () => console.error("[OneSignal] SDK load error");
    document.head.appendChild(script);
  }, []);

  // Initialize OneSignal and set user data when ready  useEffect(() => {
    if (!isReady || !window.OneSignal) return;

    // Initialize only once
    if (oneSignalInitialized.current) return;
    oneSignalInitialized.current = true;

    window.OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      autoSubscribe: false,
    });

    // Set external user ID if available
    if (user?.id) {
      window.OneSignal.setExternalUserId(user.id);
      console.log(`[OneSignal] External user ID set: ${user.id}`);
    }

    // Set admin tag if user is admin
    if (user?.role === "admin") {
      window.OneSignal.sendTags({ role: user.role });
      console.log(`[OneSignal] Admin tag set: ${user.role}`);
    }
  }, [isReady, user]);

  // Update external user ID and tags when user changes (after initialization)
  useEffect(() => {
    if (!isReady || !window.OneSignal || !oneSignalInitialized.current) return;

    // Update external user ID
    if (user?.id) {
      window.OneSignal.setExternalUserId(user.id);
      console.log(`[OneSignal] External user ID updated: ${user.id}`);
    } else {
      // If no user, remove external user ID
      window.OneSignal.removeExternalUserId();
      console.log("[OneSignal] External user ID removed");
    }

    // Update admin tag
    if (user?.role === "admin") {
      window.OneSignal.sendTags({ role: user.role });
      console.log(`[OneSignal] Admin tag updated: ${user.role}`);
    } else {
      // Remove admin tag if not admin
      window.OneSignal.sendTags({ role: "" });
      console.log("[OneSignal] Admin tag removed");
    }
  }, [user]);

  return null;
}