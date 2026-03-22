import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext"; // adjust path to your auth context

export default function OneSignalInit() {
  const { user } = useAuth(); // assume user object has id and role
  const [isReady, setIsReady] = useState(false);
  const initAttempted = useRef(false);

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

  useEffect(() => {
    if (!isReady || !window.OneSignal) return;

    const OneSignal = window.OneSignal || [];

    OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      autoSubscribe: false,
    });

    // Only set external user ID after login
    if (user?.id) {
      OneSignal.setExternalUserId(user.id);
      console.log("[OneSignal] External user ID set:", user.id);
    }

    // Set admin tag if user is admin
    if (user?.role === "admin") {
      OneSignal.sendTags({ role: user.role });
      console.log("[OneSignal] Admin tag set:", user.role);
    }
  }, [isReady, user]);

  return null;
}