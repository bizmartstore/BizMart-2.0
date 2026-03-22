import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    OneSignal: any;
  }
}

export function useOneSignal(user?: { id?: string; role?: string }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [hasPrompted, setHasPrompted] = useState(false);
  const initializedRef = useRef(false);
  const scriptLoadedRef = useRef(false);
  const loginAttemptedRef = useRef(false);

  const loadSDK = useCallback(() => {
    if (scriptLoadedRef.current) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.async = true;

      script.onload = () => {
        scriptLoadedRef.current = true;
        console.log("[OneSignal] SDK script loaded");
        resolve();
      };
      script.onerror = () => {
        console.error("[OneSignal] Failed to load SDK");
        reject(new Error("OneSignal SDK load error"));
      };
      document.head.appendChild(script);
    });
  }, []);

  const initializeOneSignal = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

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

      // -------------------------------------------------------------
      // Core initialization
      // -------------------------------------------------------------
      await window.OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        autoSubscribe: false,               // we handle subscription manually
        promptOptions: {
          actionMessage: "Enable notifications to receive order updates",
          acceptButtonText: "Allow",
          cancelButtonText: "Later",
        },
      });

      console.log("[OneSignal] Initialized");

      // -------------------------------------------------------------
      // 3️⃣ Check subscription status (desktop auto‑subscribed users are
      //    reported as subscribed by the SDK)
      // -------------------------------------------------------------
      const optedIn = await window.OneSignal.User.PushSubscription.getOptedIn();
      setIsSubscribed(optedIn);
      console.log("[OneSignal] Subscription status:", optedIn ? "subscribed" : "not subscribed");

      // -------------------------------------------------------------
      // 4️⃣ Get player ID – useful for debugging / fallback sends
      // -------------------------------------------------------------
      try {
        const pid = await window.OneSignal.User.PushSubscription.getId();
        setPlayerId(pid);
        console.log("[OneSignal] Player ID:", pid || "null");
      } catch (e) {
        console.warn("[OneSignal] Could not fetch player ID:", e);
      }

      // -------------------------------------------------------------
      // 5️⃣ If not subscribed, show the prompt
      // -------------------------------------------------------------      if (!optedIn && !hasPrompted) {
        console.log("[OneSignal] User not subscribed – showing prompt");
        try {
          await window.OneSignal.showSlidedownPrompt();
          setHasPrompted(true);
          // Re‑check subscription after the user interacts
          const newlySubscribed = await window.OneSignal.User.PushSubscription.getOptedIn();
          setIsSubscribed(newlySubscribed);
          console.log("[OneSignal] Subscription updated after prompt:", newlySubscribed);
        } catch (e) {
          console.warn("[OneSignal] Prompt failed or was dismissed:", e);
        }
      }

      // -------------------------------------------------------------
      // 6️⃣ **Always** set the External ID – enables Edge Function targeting
      // -------------------------------------------------------------
      if (user?.id) {
        await window.OneSignal.login(user.id.toString());
        console.log(`[OneSignal] External ID set to ${user.id}`);

        // -------------------------------------------------------------
        // 7️⃣ Tag the user based on Supabase profile.role
        // -------------------------------------------------------------
        const userRole = profile?.role || "customer";   // ✅ Use profile.role
        if (userRole === "main_admin" || userRole === "member_admin") {
          await window.OneSignal.User.addTag("role", "admin");
          console.log("[OneSignal] Tag 'admin' added for role:", userRole);
        } else {
          await window.OneSignal.User.addTag("role", "user");
          console.log("[OneSignal] Tag 'user' added for role:", userRole);
        }
      }
    } catch (err) {
      console.error("[OneSignal] Initialization error:", err);
    }
  }, [user, profile, hasPrompted]);

  // -------------------------------------------------------------
  // 7️⃣ Load SDK → initialize OneSignal
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

  // -------------------------------------------------------------
  // 8️⃣ React to Supabase user changes (login / logout)
  // --------------------------------------------------------------
  useEffect(() => {
    // Whenever the Supabase user object changes, re‑run the init flow.
    // This safely handles login → logout transitions without duplicate
    // SDK loads.
    initializeOneSignal();
  }, [user, profile, initializeOneSignal]);

  // -------------------------------------------------------------
  // 9️⃣ Expose a logout helper for components that need it
  // --------------------------------------------------------------
  const logout = useCallback(async () => {
    if (window.OneSignal) {
      try {
        await window.OneSignal.logout();
        console.log("[OneSignal] Manual logout performed");
        loginAttemptedRef.current = false;
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