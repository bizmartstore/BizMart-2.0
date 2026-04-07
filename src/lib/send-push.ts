import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export async function sendPushNotification(userId: string, title: string, body: string, type: string) {
  // Fetch stored FCM tokens for this user
  const { data: tokens } = await supabase    .from("user_push_tokens")
    .select("fcm_token")
    .eq("user_id", userId);

  // VAPID key (must be set in env)
  const VAPID_KEY = import.meta.env.VITE_VAPID_KEY;
  const ENDPOINT = "https://fcm.googleapis.com/fcm/send";

  for (const token of tokens) {
    if (!token.fcm_token) continue;
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `key=${VAPID_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: token.fcm_token,
          notification: {
            title,
            body,
            sound: "customer-notification.mp3",
            click_action: "https://your-app-url.com", // Adjust to your app URL
          },
        }),
      });
      if (!response.ok) throw new Error(`FCM error: ${response.status}`);
    } catch (err) {
      console.warn("Push send failed:", err);
    }
  }
}