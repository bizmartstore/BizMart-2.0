import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * OneSignalInit – Place this component at the top level of your app
 * (e.g. inside <AuthProvider> before any routing) so it runs once
 * for the whole application.
 *
 * What it does:
 * 1️⃣ Loads the OneSignal SDK exactly once.
 * 2️⃣ Waits until the SDK reports that the internal user object is ready.
 * 3️⃣ Checks the subscription status on **both** desktop and mobile.
 * 4️⃣ Calls `OneSignal.login(userId)` for **every** authenticated user,
 *    even if they haven’t clicked “Allow” yet (push will work only after
 *    they grant permission).
 * 5️⃣ Prompts users who are not subscribed with the Slidedown prompt.
 * 6️⃣ Assigns role tags (`admin`, `user`) based on the Supabase user object.
 * 7️⃣ Exposes debugging logs: subscription state, OneSignal player‑ID,
 *    External ID, and role tags.
 *
 * Usage:
 *   <AuthProvider>
 *     <OneSignalInit />
 *     {/* the rest of your app */}</AuthProvider>
 */
export default function OneSignalInit() {
  const { user } = useAuth(); // Supabase user object (null when not signed‑in)
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [hasPrompted, setHasPrompted] = useState(false);
  const initializedRef = useRef(false);
  const scriptLoadedRef = useRef(false);
  const loginAttemptedRef = useRef(false);

  /** --------------------------------------------------------------
   * 1️⃣ Load the OneSignal SDK script exactly once
   * -------------------------------------------------------------- */
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

  /** --------------------------------------------------------------
   * 2️⃣ Initialise OneSignal – runs only once
   * -------------------------------------------------------------- */
  const initializeOneSignal = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      // Wait for the global `OneSignal` object to exist
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

      // -----------------------------------------------------------------
      // Core OneSignal configuration
      // -----------------------------------------------------------------
      await window.OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        autoSubscribe: false, // we will handle subscription manually
        promptOptions: {
          actionMessage: "Enable notifications to receive order updates",
          acceptButtonText: "Allow",
          cancelButtonText: "Later",
        },
      });

      console.log("[OneSignal] Initialized");

      // -----------------------------------------------------------------
      // 3️⃣ Check subscription status (desktop auto‑subscribed users are
      //    reported as subscribed by the SDK)
      // -----------------------------------------------------------------
      const optedIn = await window.OneSignal.User.PushSubscription.getOptedIn();
      setIsSubscribed(optedIn);
      console.log("[OneSignal] Subscription status:", optedIn ? "subscribed" : "not subscribed");

      // -----------------------------------------------------------------      // 4️⃣ Get the player ID – useful for debugging / fallback sends
      // -----------------------------------------------------------------
      try {
        const pid = await window.OneSignal.User.PushSubscription.getId();
        setPlayerId(pid);
        console.log("[OneSignal] Player ID:", pid || "null");
      } catch (e) {
        console.warn("[OneSignal] Could not fetch player ID:", e);
      }

      // -----------------------------------------------------------------
      // 5️⃣ If the user is **not** subscribed, show the prompt.
      //    This works on both desktop and mobile.
      // -----------------------------------------------------------------
      if (!optedIn && !hasPrompted) {
        console.log("[OneSignal] User not subscribed – showing prompt");
        try {
          await window.OneSignal.showSlidedownPrompt();
          setHasPrompted(true);
          // Re‑check subscription after the user interacts with the prompt
          const newlySubscribed = await window.OneSignal.User.PushSubscription.getOptedIn();
          setIsSubscribed(newlySubscribed);
          console.log("[OneSignal] Subscription updated after prompt:", newlySubscribed);
        } catch (e) {
          console.warn("[OneSignal] Prompt failed or was dismissed:", e);
        }
      }

      // -----------------------------------------------------------------
      // 6️⃣ **Always** set the External ID – this is safe even if the
      //    user isn’t subscribed yet.  It enables your Edge Function to
      //    target the user via `include_external_user_ids`.
      // -----------------------------------------------------------------
      if (user?.id) {
        await window.OneSignal.login(user.id.toString());
        console.log(`[OneSignal] External ID set to ${user.id}`);

        // -----------------------------------------------------------------
        // 7️⃣ Tag the user based on Supabase role (admin / user)
        // -----------------------------------------------------------------
        const role = user.role; // assuming you store the role in `user.role`
        if (role === "admin" || role === "member_admin" || role === "main_admin") {
          await window.OneSignal.User.addTag("role", "admin");
          console.log("[OneSignal] Tag 'admin' added");
        } else {
          await window.OneSignal.User.addTag("role", "user");
          console.log("[OneSignal] Tag 'user' added");
        }
      }
    } catch (err) {
      console.error("[OneSignal] Initialization error:", err);
    }
  }, [user, hasPrompted]);

  /** --------------------------------------------------------------
   * 7️⃣ Effect: load SDK → init OneSignal
   * -------------------------------------------------------------- */
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
  }, [loadSDK, initializeOneSignal, user]);

  /** --------------------------------------------------------------
   * 8️⃣ Effect: react to Supabase user changes (login / logout)
   * -------------------------------------------------------------- */
  useEffect(() => {
    // Whenever the Supabase user object changes, re‑run the init flow.
    // This safely handles login → logout transitions without duplicate
    // SDK loads.
    initializeOneSignal();
  }, [user]);

  /** --------------------------------------------------------------
   * 9️⃣ Expose a logout helper for components that need it
   * -------------------------------------------------------------- */
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