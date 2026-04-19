import { useEffect, useCallback, useRef } from "react";
import { messaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/supabase";

// ✅ Correct Supabase insert type
type FcmTokenInsert =
  Database["public"]["Tables"]["fcm_tokens"]["Insert"];

export function useFCM() {
  const { user } = useAuth();
  const hasAttemptedRegistration = useRef(false);

  const requestPermission = useCallback(async () => {
    if (!messaging || !user || hasAttemptedRegistration.current) return;

    hasAttemptedRegistration.current = true;

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        console.log("[FCM] Permission not granted");
        return;
      }

      console.log("[FCM] Notification permission granted");

      const token = await getToken(messaging, {
        vapidKey:
          "BLIQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE",
      });

      if (!token) {
        console.warn("[FCM] No token received");
        return;
      }

      console.log("[FCM] FCM token:", token);

      // ✅ Properly typed payload (NO Record<any>)
      const payload: FcmTokenInsert = {
        user_id: user.id,
        token,
        role: (user.role as string) || "customer",
      };

      const { error } = await supabase
        .from("fcm_tokens")
        .upsert(payload, {
          onConflict: "user_id", // prevents duplicate tokens per user
        });

      if (error) {
        console.error("[FCM] Failed to save token:", error);
      } else {
        console.log("[FCM] FCM token saved successfully");
      }
    } catch (error) {
      console.warn(
        "[FCM] Permission/token error:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }, [user]);

  useEffect(() => {
    if (!user || !messaging) return;
    requestPermission();
  }, [user, requestPermission]);

  return { requestPermission };
}