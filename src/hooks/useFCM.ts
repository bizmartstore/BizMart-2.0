import { useEffect, useCallback } from "react";
import { messaging, getToken, onMessage, VAPID_KEY } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { triggerLocalPushNotification } from "@/lib/pushNotifications";

export function useFCM() {
  const { user, profile } = useAuth();

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
    if (!user) return;

    // 1. Request FCM permissions and save token
    if (messaging) {
      requestPermission();

      // Handle foreground FCM messages
      const unsubscribeFCM = onMessage(messaging, (payload) => {
        console.log("FCM Message received: ", payload);
        const title = payload.notification?.title || "New Notification";
        const body = payload.notification?.body || "";
        
        toast(title, { description: body });
        triggerLocalPushNotification(title, body);
      });

      // 2. Listen for database notification logs (Real-time Push fallback)
      // This ensures that even if FCM fails, the user gets a push if the app is active
      const channel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notification_logs",
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            const notif = payload.new;
            console.log("DB Notification received:", notif);
            
            // Trigger local push
            triggerLocalPushNotification(notif.title, notif.message);
            
            // Show toast
            toast(notif.title, {
              description: notif.message,
              action: notif.link ? {
                label: "View",
                onClick: () => window.location.href = notif.link
              } : undefined
            });
          }
        )
        .subscribe();

      return () => {
        unsubscribeFCM();
        supabase.removeChannel(channel);
      };
    }
  }, [user, requestPermission]);

  return { requestPermission };
}