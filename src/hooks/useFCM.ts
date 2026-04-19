import { useEffect, useCallback, useRef } from "react";
import { messaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface FcmToken {
  user_id: string;
  token: string;
  role: string;
  created_at?: string;
}

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

        // Get FCM token with VAPID key
        const token = await getToken(messaging, {
          vapidKey: "BLIQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE",
        });

        if (token) {
          console.log("[FCM] FCM token:", token);

          // Save token to Supabase
          const { error } = await supabase
            .from("fcm_tokens")
            .upsert({
              user_id: user.id,
              token,
              role: user.role || "customer",
              created_at: new Date().toISOString(),
            } as unknown as Record<string, unknown>);

          if (error) {
            console.error("[FCM] Failed to save FCM token to Supabase:", error);
          } else {
            console.log("[FCM] FCM token saved to Supabase");
          }
        }
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