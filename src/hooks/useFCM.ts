import { useEffect, useCallback } from "react";
import { messaging, getToken, onMessage, VAPID_KEY } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { triggerLocalPushNotification } from "@/lib/pushNotifications";

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
        // Ensure we register the service worker explicitly for FCM
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        const token = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });
        
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

    if (messaging) {
      requestPermission();

      const unsubscribeFCM = onMessage(messaging, (payload) => {
        console.log("FCM Foreground Message received: ", payload);
        const title = payload.notification?.title || "New Notification";
        const body = payload.notification?.body || "";
        
        toast(title, { description: body });
        // Local push is only needed if the browser doesn't automatically show it in foreground
        triggerLocalPushNotification(title, body);
      });

      return () => {
        unsubscribeFCM();
      };
    }
  }, [user, requestPermission]);

  return { requestPermission };
}