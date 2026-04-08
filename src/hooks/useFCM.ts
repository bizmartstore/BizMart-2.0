import { useEffect, useCallback } from "react";
import { messaging, getToken, onMessage, VAPID_KEY } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useFCM() {
  const { user } = useAuth();

  const saveTokenToDb = useCallback(async (token: string) => {
    if (!user) return;
    
    try {
      const { error } = await (supabase as any)
        .from("fcm_tokens")
        .upsert(
          { user_id: user.id, token, device_type: "web" },
          { onConflict: "user_id,token" }
        );
      
      if (error) console.error("Error saving FCM token:", error);
    } catch (err) {
      console.error("Failed to save FCM token to database:", err);
    }
  }, [user]);

  const requestPermission = useCallback(async () => {
    if (!messaging || !user) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          await saveTokenToDb(token);
        }
      }
    } catch (error) {
      console.error("An error occurred while requesting permission to notify:", error);
    }
  }, [user, saveTokenToDb]);

  useEffect(() => {
    if (user && messaging) {
      requestPermission();

      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Message received in foreground: ", payload);
        toast(payload.notification?.title || "New Notification", {
          description: payload.notification?.body,
        });
      });

      return () => unsubscribe();
    }
  }, [user, requestPermission]);

  return { requestPermission };
}