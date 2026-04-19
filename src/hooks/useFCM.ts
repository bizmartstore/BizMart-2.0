import { useEffect, useCallback, useRef } from "react";
import { messaging } from "@/lib/firebase";
import { getToken, isSupported } from "firebase/messaging";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/supabase";

type FcmTokenInsert = Database["public"]["Tables"]["fcm_tokens"]["Insert"];

export function useFCM() {
  const { user } = useAuth();
  const hasAttemptedRegistration = useRef(false);

  const requestPermission = useCallback(async () => {
    try {
      // ✅ Prevent duplicate calls
      if (!user || hasAttemptedRegistration.current) return;

      // ✅ Check if messaging is supported (important for Safari / SSR)
      const supported = await isSupported();
      if (!supported) {
        console.log("[FCM] Messaging not supported in this browser.");
        return;
      }

      if (!messaging) {
        console.log("[FCM] Messaging not initialized.");
        return;
      }

      hasAttemptedRegistration.current = true;

      // ✅ Ask notification permission
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        console.log("[FCM] Notification permission denied.");
        return;
      }

      // ✅ Wait for service worker
      const registration = await navigator.serviceWorker.ready;

      if (!registration) {
        console.error("[FCM] No service worker registration found.");
        return;
      }

      // ✅ Get FCM token (CRITICAL FIX HERE)
      const token = await getToken(messaging, {
        vapidKey: "BLIQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE",
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        console.log("[FCM] No token received.");
        return;
      }

      console.log("[FCM] Token received:", token);

      // ✅ Save token to Supabase
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
        console.error("[FCM] Error saving token:", error);
      } else {
        console.log("[FCM] Token saved successfully.");
      }
    } catch (err) {
      console.error("[FCM] Error:", err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    requestPermission();
  }, [user, requestPermission]);

  return { requestPermission };
}