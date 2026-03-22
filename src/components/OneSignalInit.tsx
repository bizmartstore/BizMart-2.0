import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

export default function OneSignalInit() {
  const { user } = useAuth();
  const initAttempted = useRef(false);
  const subscriptionChecked = useRef(false);

  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = async () => {
      console.log("[OneSignal] SDK loaded");
      window.OneSignal = window.OneSignal || [];
      
      window.OneSignal.push(async () => {
        try {
          // Initialize OneSignal
          await window.OneSignal.init({
            appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            autoRegister: false,
            // We'll handle registration manually after login
          });
          
          console.log("[OneSignal] SDK initialized");

          // Check if we have a user
          if (!user?.id) {
            console.log("[OneSignal] No user yet, waiting for auth");
            return;
          }

          // Login to set external ID
          console.log(`[OneSignal] Logging in user ID: ${user.id}`);
          await window.OneSignal.login(user.id.toString());
          console.log("[OneSignal] External ID set successfully");

          // Add role tag if user has role
          if (user.role) {
            await window.OneSignal.User.addTag('role', user.role);
            console.log(`[OneSignal] Added role tag: ${user.role}`);
          }

          // Check subscription status and prompt if needed
          const isSubscribed = await window.OneSignal.User.PushSubscription.getOptedIn();
          console.log(`[OneSignal] Subscription status: ${isSubscribed}`);
          
          if (!isSubscribed) {
            console.log("[OneSignal] Showing subscription prompt");
            await window.OneSignal.showSlidedownPrompt();
          } else {
            console.log("[OneSignal] User already subscribed");
          }
        } catch (err) {
          console.error("[OneSignal] Initialization error:", err);
        }
      });
    };

    script.onerror = () => console.error("[OneSignal] SDK load error");
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [user]);

  return null;
}