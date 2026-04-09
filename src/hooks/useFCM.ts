import { useEffect, useCallback, useRef } from "react";
import { messaging, getToken, onMessage, VAPID_KEY } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { triggerLocalPushNotification } from "@/lib/pushNotifications";

export function useFCM() {
  const { user } = useAuth();
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const saveTokenToDb = useCallback(async (token: string) => {
    if (!user) return;
    try {
      await (supabase as any).from("fcm_tokens").upsert(
        { user_id: user.id, token, device_type: "web" },
        { onConflict: "user_id,token" }
      );
    } catch (err) {
      console.error("Failed to save FCM token:", err);
    }
  }, [user]);

  const requestPermission = useCallback(async () => {
    if (!messaging || !user) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Only register if not already registered to avoid loops
        if (!registrationRef.current) {
          registrationRef.current = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/firebase-cloud-messaging-push-scope'
          });
        }
        
        const token = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registrationRef.current 
        });
        
        if (token) {
          await saveTokenToDb(token);
          console.log("[FCM] Token generated and saved");
        }
      }
    } catch (error) {
      console.error("[FCM] Permission/Token error:", error);
    }
  }, [user, saveTokenToDb]);

  useEffect(() => {
    if (!user || !messaging) return;

    requestPermission();

    const unsubscribeFCM = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "New Notification";
      const body = payload.notification?.body || "";
      toast(title, { description: body });
      triggerLocalPushNotification(title, body);
    });

    // Real-time fallback for active sessions
    const channel = supabase.channel(`user-notifications-${user.id}`)
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "notification_logs", 
        filter: `user_id=eq.${user.id}` 
      }, (payload: any) => {
        const notif = payload.new;
        toast(notif.title, { description: notif.message });
        triggerLocalPushNotification(notif.title, notif.message);
      }).subscribe();

    return () => {
      unsubscribeFCM();
      supabase.removeChannel(channel);
    };
  }, [user, requestPermission]);

  return { requestPermission };
}