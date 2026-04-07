import { useEffect, useState, useRef } from "react";
import { requestUserPermission } from "@/firebase-messaging-sw-polyfill";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useFCM() {
  const { user, profile } = useAuth();
  const isLoaded = useRef(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded.current || !user) return;
    isLoaded.current = true;

    (async () => {
      // Only request FCM for customers
      if (profile?.role !== 'customer') {
        console.log("[useFCM] Skipping FCM token request for non-customer role:", profile?.role);
        return;
      }

      const fcmToken = await requestUserPermission();
      if (fcmToken) {
        setToken(fcmToken);
        const { error } = await (supabase as any).from("user_push_tokens").upsert([
          {
            user_id: user.id,
            role: profile?.role || "customer",
            fcm_token: fcmToken,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ], { onConflict: "user_id,fcm_token" });
        
        if (error) console.error("Failed to store FCM token:", error);
      }
    })();
  }, [user, profile]);

  return { token };
}