import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

interface UseOneSignalReturn {
  isInitialized: boolean;
  isSubscribed: boolean;
  logout: () => Promise<void>;
  playerId: string | null;
}

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

export function useOneSignal(): UseOneSignalReturn {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  const initializedRef = useRef(false);
  const scriptLoadedRef = useRef(false);
  const loginAttemptedRef = useRef(false);

  // Load OneSignal SDK script only once
  const loadSDK = useCallback(() => {
    if (scriptLoadedRef.current) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        console.log("[OneSignal] SDK loaded successfully");
        resolve(null);
      };
      script.onerror = () => {
        console.error("[OneSignal] Failed to load SDK");
        reject(new Error("Failed to load OneSignal SDK"));
      };
      document.head.appendChild(script);
    });
  }, []);

  // Initialize OneSignal only once
  const initializeOneSignal = useCallback(async () => {
    if (initializedRef.current || !window.OneSignal) return;
    
    try {
      await window.OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        autoSubscribe: false,
        notifyButton: {
          enable: false,
        },
      });
      
      initializedRef.current = true;
      setIsInitialized(true);
      console.log("[OneSignal] Initialized successfully");
      
      // Check subscription status
      const optedIn = await window.OneSignal.User.PushSubscription.getOptedIn();
      setIsSubscribed(optedIn);
      
      // Get player ID for debugging
      try {
        const id = await window.OneSignal.User.PushSubscription.getId();
        setPlayerId(id);
        console.log(`[OneSignal] Player ID: ${id || 'null (not subscribed)'}`);
      } catch (e) {
        console.warn("[OneSignal] Could not get player ID:", e);
      }
      
      // If not subscribed, show prompt
      if (!optedIn) {
        console.log("[OneSignal] User not subscribed, showing prompt...");
        try {
          await window.OneSignal.showSlidedownPrompt();
          // Re-check subscription after prompt
          const newOptedIn = await window.OneSignal.User.PushSubscription.getOptedIn();
          setIsSubscribed(newOptedIn);
          if (newOptedIn) {
            try {
              const newId = await window.OneSignal.User.PushSubscription.getId();
              setPlayerId(newId);
              console.log(`[OneSignal] Subscribed! Player ID: ${newId}`);
            } catch (e) {
              console.warn("[OneSignal] Could not get player ID after subscription:", e);
            }
          }
        } catch (e) {
          console.warn("[OneSignal] Prompt failed or was dismissed:", e);
        }
      }
    } catch (error) {
      console.error("[OneSignal] Initialization error:", error);
    }
  }, []);

  // Handle user login/logout
  const handleUserChange = useCallback(async (currentUser: any) => {
    if (!isInitialized || !window.OneSignal) return;
    
    try {
      if (currentUser?.id) {
        // Login: set external user ID
        await window.OneSignal.login(currentUser.id.toString());
        console.log(`[OneSignal] User logged in with ID: ${currentUser.id}`);
        loginAttemptedRef.current = true;
        
        // Set admin tag if applicable
        if (currentUser.role === "admin" || currentUser.role === "main_admin" || currentUser.role === "member_admin") {
          await window.OneSignal.User.addTag("role", "admin");
          console.log("[OneSignal] Admin tag set");
        } else {
          await window.OneSignal.User.addTag("role", "user");
          console.log("[OneSignal] User tag set");
        }
      } else {
        // Logout: remove external user ID
        if (loginAttemptedRef.current) {
          await window.OneSignal.logout();
          console.log("[OneSignal] User logged out");
          loginAttemptedRef.current = false;
        }
      }
    } catch (error) {
      console.error("[OneSignal] User change error:", error);
    }
  }, [isInitialized]);

  // Main initialization effect
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        await loadSDK();
        if (mounted) {
          // Wait a bit for the script to fully load
          setTimeout(() => {
            if (mounted && window.OneSignal) {
              initializeOneSignal();
            }
          }, 100);
        }
      } catch (error) {
        console.error("[OneSignal] Init failed:", error);
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, [loadSDK, initializeOneSignal]);

  // Handle user changes
  useEffect(() => {
    handleUserChange(user);
  }, [user, handleUserChange]);

  // Logout function
  const logout = useCallback(async () => {
    if (!window.OneSignal) return;
    try {
      await window.OneSignal.logout();
      console.log("[OneSignal] Manual logout completed");
      loginAttemptedRef.current = false;
    } catch (error) {
      console.error("[OneSignal] Logout error:", error);
    }
  }, []);

  return {
    isInitialized,
    isSubscribed,
    logout,
    playerId,
  };
}