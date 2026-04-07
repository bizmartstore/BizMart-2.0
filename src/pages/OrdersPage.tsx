# No changes needed
</dyad-file>

<dyad-write path="src/lib/send_push_notification.ts" description="Utility to send push notification via Firebase Admin SDK (final)">
import { createAdminClient } from "@/lib/firebase-admin";
import { supabase } from "@/integrations/supabase/client";

export async function send_push_notification(user_id: string, type: string) {
  // Fetch stored tokens for this user
  const { data: tokens } = await supabase.from("user_push_tokens").select("fcm_token").eq("user_id", user_id);
  if (!tokens || tokens.length === 0) return;

  const adminClient = createAdminClient();
  const message = {
    token: tokens[0].fcm_token,
    notification: {
      title: "New Notification",
      body: `You have a ${type} notification`,
      icon: "https://storage.googleapis.com/firebasewebapps/webapp/img/ic_notification@2x.png",
    },
    data: {
      type: type,
      user_id: user_id,
    },
  };

  const response = await adminClient.messaging().send(message);
  if (!response) console.warn("FCM send failed:", response);
}