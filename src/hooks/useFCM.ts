import { useEffect, useCallback, useRef } from "react";
import { messaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/supabase";

type FcmTokenInsert = Database["public"]["Tables"]["fcm_tokens"]["Insert"];

export function useFCM() {
  const { user } = useAuth();
  const hasAttemptedRegistration = useRef(false);

  const requestPermission = useCallback(async () => {
    if (!messaging || !user || hasAttemptedRegistration.current) return;

    hasAttemptedRegistration.current = true;

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") return;

      const token = await getToken(messaging, {
        vapidKey:
          "BLIQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE",
      });

      if (!token) return;

      const payload: FcmTokenInsert = {
        user_id: user.id,
        token,
        device_type: "web",
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("fcm_tokens")
        .upsert(payload, {
          onConflict: "user_id",
        });

      if (error) {
        console.error("[FCM] Error:", error);
      }
    } catch (err) {
      console.warn("[FCM]", err);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !messaging) return;
    requestPermission();
  }, [user, requestPermission]);

  return { requestPermission };
}