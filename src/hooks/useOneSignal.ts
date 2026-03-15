import { useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import {
  initOneSignal,
  onOneSignalReady,
  oneSignalLogin,
  oneSignalLogout,
  requestPushPermission,
  isPushSupported,
  getNotificationPermission,
} from "@/lib/onesignal-client";

export function useOneSignal() {
  const { user, profile } = useAuth();
  const { role, loading: roleLoading } = useAdmin();

  // Initialize OneSignal on app load
  useEffect(() => {
    if (isPushSupported()) {
      initOneSignal();
    }
  }, []);

  // Handle user login/logout and tag updates
  useEffect(() => {
    if (!user || !profile || roleLoading) return;

    const effectiveRole = role || "customer";
    
    // Login and tag user
    oneSignalLogin(user.id, profile.email, `${profile.first_name} ${profile.last_name}`, effectiveRole)
      .then(() => {
        console.log(`[useOneSignal] User ${user.id} tagged with role: ${effectiveRole}`);
      })
      .catch((error) => {
        console.error('[useOneSignal] Failed to tag user:', error);
      });

    // Cleanup on logout
    return () => {
      if (!user) {
        oneSignalLogout().catch(console.error);
      }
    };
  }, [user, profile, role, roleLoading]);

  // Request permission function
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const hasSupport = isPushSupported();
    if (!hasSupport) {
      console.warn('[useOneSignal] Push notifications not supported');
      return false;
    }

    const permission = await getNotificationPermission();
    if (permission === 'granted') {
      return true;
    }

    return await requestPushPermission();
  }, []);

  return {
    requestPermission,
    isSupported: isPushSupported(),
  };
}