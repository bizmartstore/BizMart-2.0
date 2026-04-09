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
      const userRole = profile?.role || 'customer';
      console.log(`[FCM] Attempting to save token for user ${user.id} with role ${userRole}`);
      
      // We use 'fcm_token' as the conflict target because each token is unique to a device/browser
      const { error } = await (supabase as any)
        .from("user_push_tokens")
        .upsert(
          { 
            user_id: user.id, 
            fcm_token: token, 
            role: userRole,
            updated_at: new Date().toISOString()
          },
          { onConflict: "fcm_token" }
        );
      
      if (error) {
        console.error("[FCM] Error saving token:", error);
        // Fallback: if upsert fails, try a simple insert and ignore errors
        if (error.code === '42P10') {
          console.warn("[FCM] Unique constraint missing, falling back to simple insert");
          await (supabase as any).from("user_push_tokens").insert({ 
            user_id: user.id, 
            fcm_token: token, 
            role: userRole 
          }).catch(() => {});
        }
      } else {
        console.log("[FCM] Token saved successfully");
      }
    } catch (err) {
      console.error("[FCM] Critical failure saving token:", err);
    }
  }, [user, profile]);

  const requestPermission = useCallback(async () => {
    if (!messaging || !user) return;

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        // Ensure service worker is ready
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        
        const token = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });

        if (token) {
          await saveTokenToDb(token);
        }
      }
    } catch (error) {
      console.error("[FCM] Permission/Token request error:", error);
    }
  }, [user, saveTokenToDb]);

  useEffect(() => {
    if (!user) return;

    if (messaging) {
      requestPermission();

      const unsubscribeFCM = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || "New Notification";
        const body = payload.notification?.body || "";
        toast(title, { description: body });
        triggerLocalPushNotification(title, body);
      });

      // Real-time listener for the notification_logs table
      const channel = supabase
        .channel(`user-notifs-${user.id}`)
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