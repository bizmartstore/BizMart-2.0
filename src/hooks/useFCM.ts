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
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        console.log("[FCM] Notification permission granted");
      }
    } catch (error) {
      console.warn("[FCM] Permission error (OK if not supported):", error instanceof Error ? error.message : String(error));
    }
  }, [user]);

  useEffect(() => {
    if (!user || !messaging) return;
    requestPermission();
  }, [user, requestPermission]);

  return { requestPermission };
}
