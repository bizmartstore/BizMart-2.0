import { useEffect, useCallback, useRef } from "react";
import { messaging, getToken, onMessage, VAPID_KEY } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      // Check if service worker is already registered
      if ('serviceWorker' in navigator) {
        try {
          registrationRef.current = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
          if (!registrationRef.current) {
            registrationRef.current = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
              scope: '/',
              type: 'module'
            });
          }
        } catch (swError) {
          console.error("[FCM] Service Worker registration failed:", swError);
          return;
        }
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
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

    // Handle foreground messages
    const unsubscribeFCM = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "New Notification";
      const body = payload.notification?.body || "";

      toast(title, {
        description: body,
        action: payload.data?.link ? {
          label: "View",
          onClick: () => window.location.href = payload.data?.link
        } : undefined
      });
    });

    return () => {
      unsubscribeFCM();
    };
  }, [user, requestPermission]);

  return { requestPermission };
}