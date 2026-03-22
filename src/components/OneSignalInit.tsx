import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function OneSignalInit() {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const initAttempted = useRef(false);
  const oneSignalInitialized = useRef(false);

  // Load OneSignal SDK
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

  // Initialize OneSignal when SDK is ready
  useEffect(() => {
    if (!isReady || !window.OneSignal) return;
    if (oneSignalInitialized.current) return;
    oneSignalInitialized.current = true;

    window.OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      autoSubscribe: false,
    });

    // Set external user ID and tags immediately after init
    if (user?.id) {
      window.OneSignal.setExternalUserId(user.id);
      console.log(`[OneSignal] External user ID set: ${user.id}`);
    }
    if (user?.role === "admin") {
      window.OneSignal.sendTags({ role: user.role });
      console.log(`[OneSignal] Admin tag set: ${user.role}`);
    }
  }, [isReady, user]);

  // Update external ID and tags when user changes
  useEffect(() => {
    if (!isReady || !window.OneSignal || !oneSignalInitialized.current) return;

    // Update external user ID
    if (user?.id) {
      window.OneSignal.setExternalUserId(user.id);
      console.log(`[OneSignal] External user ID updated: ${user.id}`);
    } else {
      window.OneSignal.removeExternalUserId();
      console.log("[OneSignal] External user ID removed");
    }

    // Update admin tag    if (user?.role === "admin") {
      window.OneSignal.sendTags({ role: user.role });
      console.log(`[OneSignal] Admin tag updated: ${user.role}`);
    } else {
      window.OneSignal.sendTags({ role: "" });
      console.log("[OneSignal] Admin tag removed");
    }
  }, [user]);

  return null;
}