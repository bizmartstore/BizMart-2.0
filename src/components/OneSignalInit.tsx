import { useEffect, useRef, useState } from "react";

export default function OneSignalInit() {
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
    window.OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      autoSubscribe: false,
    });
  }, [isReady]);
}