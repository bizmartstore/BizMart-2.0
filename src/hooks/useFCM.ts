import { useEffect, useCallback, useRef, useState } from "react";
import { initMessaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/supabase";

type FcmTokenInsert = Database["public"]["Tables"]["fcm_tokens"]["Insert"];

export function useFCM() {
  const { user } = useAuth();
  const hasAttemptedRegistration = useRef(false);
  const [messaging, setMessaging] = useState<any>(null);

  useEffect(() => {
    initMessaging().then((msg) => {
      if (msg) setMessaging(msg);
    });
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      if (!user || !messaging) return;

      if (hasAttemptedRegistration.current) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("[FCM] Permission denied");
        return;
      }

      // ✅ FIX: Get correct SW
      const registration = await navigator.serviceWorker.getRegistration(
        "/firebase-messaging-sw.js"
      );

      if (!registration) {
        console.error("[FCM] Service worker not found");
        return;
      }

      const token = await getToken(messaging, {
        vapidKey: "BLiQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE",
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        console.log("[FCM] No token received");
        return;
      }

      console.log("[FCM] Token:", token);

      const payload: FcmTokenInsert = {
        user_id: user.id,
        token,
        device_type: "web",
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("fcm_tokens")
        .upsert(payload, { onConflict: "token" }); // ✅ FIXED

      if (error) {
        console.error("[FCM] Save error:", error);
      } else {
        console.log("[FCM] Token saved");
        hasAttemptedRegistration.current = true; // ✅ move here
      }
    } catch (err) {
      console.error("[FCM] Error:", err);
    }
  }, [user, messaging]);

  useEffect(() => {
    if (user && messaging) {
      requestPermission();
    }
  }, [user, messaging, requestPermission]);

  return { requestPermission };
}