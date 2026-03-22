import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    OneSignal: any;
  }
}

/**
 * OneSignalInit – Handles OneSignal SDK loading, initialization,
 * user External ID assignment, role tagging, and subscription prompts.
 * 
 * Usage: Place inside <AuthProvider> at the root of your app.
 */
export default function OneSignalInit() {
  const { user, profile } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [hasPrompted, setHasPrompted] = useState(false);
  
  const sdkLoadedRef = useRef(false);
  const initializedRef = useRef(false);

  // 1️⃣ Load OneSignal SDK script once
  useEffect(() => {
    if (sdkLoadedRef.current) return;

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;
    script.onload = () => {
      sdkLoadedRef.current = true;
      console.log("[OneSignal] SDK script loaded");
    };
    script.onerror = () => {
      console.error("[OneSignal] Failed to load SDK script");
    };
    document.head.appendChild(script);
  }, []);

  // 2️⃣ Initialize OneSignal once SDK is ready
  useEffect(() => {
    if (!sdkLoadedRef.current || initializedRef.current) return;

    const init = async () => {
      try {
        // Wait for global OneSignal object
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

        initializedRef.current = true;
        setIsInitialized(true);
        console.log("[OneSignal] SDK initialized");
      } catch (err) {
        console.error("[OneSignal] Initialization error:", err);
      }
    };

    init();
  }, []);

  // 3️⃣ Set up user (External ID + role tag) whenever user or profile changes
  useEffect(() => {
    if (!initializedRef.current || !user?.id) return;

    const setupUser = async () => {
      try {
        // Set External ID (always safe, even if not subscribed)
        await window.OneSignal.login(user.id.toString());
        console.log(`[OneSignal] External ID set: ${user.id}`);

        // Add role tag based on profile.role
        const userRole = profile?.role || "customer";
        const tagValue = userRole === "main_admin" || userRole === "member_admin" ? "admin" : "user";
        await window.OneSignal.User.addTag("role", tagValue);
        console.log(`[OneSignal] Role tag set: ${tagValue} (from role: ${userRole})`);
      } catch (err) {
        console.error("[OneSignal] User setup error:", err);
      }
    };

    setupUser();
  }, [user, profile]);

  // 4️⃣ Check subscription status and prompt if needed
  useEffect(() => {
    if (!initializedRef.current) return;

    const checkAndPrompt = async () => {
      try {
        const optedIn = await window.OneSignal.User.PushSubscription.getOptedIn();
        setIsSubscribed(optedIn);
        console.log("[OneSignal] Subscription status:", optedIn ? "subscribed" : "not subscribed");

        if (!optedIn && !hasPrompted) {
          console.log("[OneSignal] Showing subscription prompt");
          try {
            await window.OneSignal.showSlidedownPrompt();
            setHasPrompted(true);
            const newStatus = await window.OneSignal.User.PushSubscription.getOptedIn();
            setIsSubscribed(newStatus);
            console.log("[OneSignal] Subscription after prompt:", newStatus);
          } catch (e) {
            console.warn("[OneSignal] Prompt failed:", e);
          }
        }
      } catch (err) {
        console.error("[OneSignal] Subscription check error:", err);
      }
    };

    checkAndPrompt();
  }, [hasPrompted]);

  // 5️⃣ Get player ID for debugging
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