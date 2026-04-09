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
      // The database trigger 'send_push_notification' reads from 'user_push_tokens'
      // We must save the token there with the correct role.
      const userRole = profile?.role || 'customer';
      
      const { error } = await (supabase as any)
        .from("user_push_tokens")
        .upsert(
          { 
            user_id: user.id, 
            fcm_token: token, 
            role: userRole 
          },
          { onConflict: "user_id,fcm_token" }
        );
      
      if (error) console.error("[FCM] Error saving token to user_push_tokens:", error);
      else console.log("[FCM] Token saved successfully for role:", userRole);
    } catch (err) {
      console.error("[FCM] Failed to save token to database:", err);
    }
  }, [user, profile]);

  const requestPermission = useCallback(async () => {
    if (!messaging || !user) return;

    try {
      console.log("[FCM] Requesting notification permission...");
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        console.log("[FCM] Permission granted. Registering service worker...");
        
        // Explicitly register the service worker to avoid timeout issues
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        
        const token = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });

        if (token) {
          console.log("[FCM] Token generated:", token.slice(0, 10) + "...");
          await saveTokenToDb(token);
        }
      } else {
        console.warn("[FCM] Permission denied for notifications");
      }
    } catch (error) {
      console.error("[FCM] Error during permission/token request:", error);
    }
  }, [user, saveTokenToDb]);

  useEffect(() => {
    if (!user) return;

    // Initialize FCM
    if (messaging) {
      requestPermission();

      // Handle foreground messages
      const unsubscribeFCM = onMessage(messaging, (payload) => {
        console.log("[FCM] Foreground message received:", payload);
        const title = payload.notification?.title || "New Notification";
        const body = payload.notification?.body || "";
        
        toast(title, { description: body });
        triggerLocalPushNotification(title, body);
      });

      // Real-time fallback for active app sessions
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
            console.log("[FCM] DB Notification received:", notif);
            
            triggerLocalPushNotification(notif.title, notif.message);
            
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