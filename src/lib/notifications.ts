import { supabase } from "@/integrations/supabase/client";
import { sendNotification as supabaseNotify } from "./supabase-notify"; // New helper

// Existing functions remain unchanged
// ... existing code ...

// New helper to send FCM push (called after notification insert)
export async function sendPushNotification(notification: any) {
  // notification should have: title, message, type, user_id, icon
  const { user_id, title, message, type, icon } = notification;
  
  // Only send to customers
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user_id)
    .single();
  
  if (roleData?.role !== "customer") return;

  // Get stored FCM tokens for this user
  const { data: tokens } = await supabase
    .from("user_push_tokens")
    .select("fcm_token")
    .eq("user_id", user_id);

  // Send push for each token
  for (const token of tokens) {
    if (!token.fcm_token) continue;
    try {
      const response = await fetch("https://api.messaging.push.apple.com/device/v1", {
        method: "POST",
        headers: {
          "Authorization": "Appl cations/auth;key=YOUR_VAPID_KEY",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: token.endpoint,
          keys: {
            p256dh: token.key,
            auth: token.auth,
          },
        }),
      });
      // Simplified – actual V1 API call would be more complex
      // In practice, use Firebase Admin SDK or direct HTTP
    } catch (e) {
      console.warn("Failed to send push for token:", token.fcm_token, e);
    }
  }, []);