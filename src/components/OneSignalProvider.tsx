import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalInitialized?: boolean;
  }
}

export default function OneSignalProvider() {
  const { user } = useAuth();
  const initializedRef = useRef(false);
  const sdkReadyRef = useRef(false);
  const pendingLoginRef = useRef<string | null>(null);

  // Initialize OneSignal SDK only once
  const initializeOneSignal = useCallback(() => {
    if (initializedRef.current) {
      console.log("[OneSignal] Already initialized, skipping");
      return;
    }

    console.log("[OneSignal] Starting initialization...");
    initializedRef.current = true;

    // Check if OneSignal is already loaded (from script tag)
    if (window.OneSignal) {
      console.log("[OneSignal] SDK already present, initializing...");
      initSDK();
      return;
    }

    // Load SDK script
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;
    script.onload = () => {
      console.log("[OneSignal] SDK script loaded");
      initSDK();
    };
    script.onerror = () => {
      console.error("[OneSignal] Failed to load SDK script");
      initializedRef.current = false; // Allow retry
    };
    document.head.appendChild(script);
  }, []);

  const initSDK = () => {
    try {
      window.OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        autoRegister: false, // We'll handle subscription manually
        // Disable OneSignal's service worker to avoid conflicts
        serviceWorker: {
          path: "/OneSignalSDKWorker.js",
          // Don't let OneSignal register its own SW if we already have one
          register: () => {}, // No-op to prevent auto-registration
        },
      });

      console.log("[OneSignal] SDK initialized successfully");
      sdkReadyRef.current = true;

      // Check subscription status
      window.OneSignal.User.PushSubscription.getOptedIn()
        .then((isSubscribed: boolean) => {
          console.log(`[OneSignal] Subscription status: ${isSubscribed}`);
          if (!isSubscribed) {
            console.log("[OneSignal] Showing subscription prompt");
            window.OneSignal.showSlidedownPrompt();
          } else {
            console.log("[OneSignal] User already subscribed");
          }
        })
        .catch((err: Error) => {
          console.error("[OneSignal] Failed to check subscription:", err);
        });

      // Process any pending login
      if (pendingLoginRef.current) {
        console.log("[OneSignal] Processing pending login for:", pendingLoginRef.current);
        setExternalId(pendingLoginRef.current);
        pendingLoginRef.current = null;
      }
    } catch (err) {
      console.error("[OneSignal] initSDK error:", err);
      initializedRef.current = false;
    }
  };

  const setExternalId = async (userId: string) => {
    if (!window.OneSignal || !sdkReadyRef.current) {
      console.log("[OneSignal] SDK not ready, queuing login for:", userId);
      pendingLoginRef.current = userId;
      return;
    }

    try {
      console.log(`[OneSignal] Setting External ID: ${userId}`);
      await window.OneSignal.login(userId);
      console.log("[OneSignal] External ID set successfully");

      // Add role tag if available
      if (user?.role) {
        try {
          await window.OneSignal.User.addTag('role', user.role);
          console.log(`[OneSignal] Added role tag: ${user.role}`);
        } catch (tagError) {
          console.error("[OneSignal] Failed to add tag:", tagError);
        }
      }
    } catch (err) {
      console.error("[OneSignal] Login failed:", err);
    }
  };

  const removeExternalId = async () => {
    if (!window.OneSignal || !sdkReadyRef.current) {
      console.log("[OneSignal] SDK not ready, skipping logout");
      return;
    }

    try {
      console.log("[OneSignal] Removing External ID (logout)");
      await window.OneSignal.logout();
      console.log("[OneSignal] Logout successful");
    } catch (err) {
      console.error("[OneSignal] Logout failed:", err);
    }
  };

  // Initialize OneSignal once on app mount
  useEffect(() => {
    // Prevent multiple initializations
    if (window.OneSignalInitialized) {
      console.log("[OneSignal] Global flag set, skipping initialization");
      return;
    }
    window.OneSignalInitialized = true;

    initializeOneSignal();

    // Cleanup on unmount
    return () => {
      window.OneSignalInitialized = false;
    };
  }, [initializeOneSignal]);

  // Handle user login/logout
  useEffect(() => {
    if (!window.OneSignal) {
      console.log("[OneSignal] SDK not available yet for auth handling");
      return;
    }

    if (user?.id) {
      setExternalId(user.id);
    } else {
      removeExternalId();
    }
  }, [user]);

  return null;
}