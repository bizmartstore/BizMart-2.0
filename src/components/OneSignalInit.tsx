import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    OneSignal: any;
  }
}

/**
 * OneSignalInit – Handles the OneSignal SDK lifecycle.
 * Must be placed inside <AuthProvider> so that a user is available.
 */
export default function OneSignalInit() {
  const { user, profile } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [hasPrompted, setHasPrompted] = useState(false);
  const initializedRef = useRef(false);
  const scriptLoadedRef = useRef(false);
  const loginAttemptedRef = useRef(false);

  // --------------------------------------------------------------
  // 1️⃣ Load the OneSignal SDK script exactly once
  // --------------------------------------------------------------
  const loadSDK = useCallback(() => {
    if (scriptLoadedRef.current) return;
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = () => {
      scriptLoadedRef.current = true;
      console.log("[OneSignal] SDK script loaded");
    };
    script.onerror = () => {
      console.error("[OneSignal] Failed to load SDK");
    };
    document.head.appendChild(script);
  }, []);

  // --------------------------------------------------------------
  // 2️⃣ Initialise OneSignal – runs only once
  // --------------------------------------------------------------
  const initializeOneSignal = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      // Wait for the global `OneSignal` object
      const waitForOneSignal = () =>
        new Promise<void>((resolve) => {
          const check = () => {
            if (window.OneSignal) {
              resolve();
            } else {
              requestAnimationFrame(check);
            }
          };
        check();
      });

      await waitForOneSignal();

      await window.OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        autoSubscribe: false,
        promptOptions: {
          actionMessage: "Enable notifications to receive order updates",
          acceptButtonText: "Allow",
          cancelButtonText: "Later",
        },
      });

      console.log("[OneSignal] SDK initialized");

      // -------------------------------------------------------------
      // 3️⃣ Set the External ID (always safe, even if not subscribed)
      // -------------------------------------------------------------
      if (user?.id) {
        await window.OneSignal.login(user.id.toString());
        console.log(`[OneSignal] External ID set: ${user.id}`);

        // Add a role tag based on the profile role
        const role = profile?.role || "customer";
        const tagValue = role === "main_admin" || role === "member_admin" ? "admin" : "user";
        await window.OneSignal.User.addTag("role", tagValue);
        console.log(`[OneSignal] Tag '${tagValue}' added for role '${role}'`);
      }
    } catch (err) {
      console.error("[OneSignal] Initialization error:", err);
    }
  }, [user, profile]);

  // --------------------------------------------------------------
  // 3️⃣ Effect: load SDK → initialise OneSignal
  // --------------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await loadSDK();
        if (mounted) initializeOneSignal();
      } catch (e) {
        console.error("[OneSignal] Setup failed:", e);
      }
    };
    init();

    return () => {
      mounted = false;
    };
  }, [loadSDK, initializeOneSignal, user, profile]);

  // --------------------------------------------------------------
  // 4️⃣ Prompt for subscription if not yet prompted
  // --------------------------------------------------------------
  useEffect(() => {
    if (!initializedRef.current || !user) return;
    const maybePrompt = async () => {
      const optedIn = await window.OneSignal.User.PushSubscription.getOptedIn();
      setIsSubscribed(optedIn);
      if (!optedIn && !hasPrompted) {
        try {
          await window.OneSignal.showSlidedownPrompt();
          setHasPrompted(true);
          const newlyOptedIn = await window.OneSignal.User.PushSubscription.getOptedIn();
          setIsSubscribed(newlyOptedIn);
        } catch (e) {
          console.warn("[OneSignal] Prompt failed:", e);
        }
      }
    };
    maybePrompt();
  }, [hasPrompted, user]);

  // --------------------------------------------------------------
  // 5️⃣ Get player ID for debugging
  // --------------------------------------------------------------
  useEffect(() => {
    if (!initializedRef.current) return;
    const getPlayerId = async () => {
      try {
        const pid = await window.OneSignal.User.PushSubscription.getId();
        setPlayerId(pid);
        console.log("[OneSignal] Player ID:", pid);
      } catch (e) {
        console.warn("[OneSignal] Could not fetch player ID:", e);
      }
    };
    getPlayerId();
  }, []);

  // --------------------------------------------------------------
  // 6️⃣ Cleanup on unmount
  // --------------------------------------------------------------
  const logout = useCallback(async () => {
    if (window.OneSignal) {
      try {
        await window.OneSignal.logout();
        console.log("[OneSignal] Logged out");
      } catch (e) {
        console.error("[OneSignal] Logout error:", e);
      }
    }
  }, []);

  return {
    isInitialized,
    isSubscribed,
    playerId,
    logout,
  };
}