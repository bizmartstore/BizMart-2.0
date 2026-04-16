import { useEffect, useCallback, useRef } from "react";
import { messaging } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export function useFCM() {
  const { user } = useAuth();
  const hasAttemptedRegistration = useRef(false);

  const requestPermission = useCallback(async () => {
    if (!messaging || !user || hasAttemptedRegistration.current) return;

    hasAttemptedRegistration.current = true;

    try {
      // Request notification permission first
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        console.log("[FCM] Notification permission granted");
        // Token will be handled by the service worker
      }
    } catch (error) {
      console.error("[FCM] Permission error:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !messaging) return;

    requestPermission();
  }, [user, requestPermission]);

  return { requestPermission };
}
