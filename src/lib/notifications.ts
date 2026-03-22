import { supabase } from "@/integrations/supabase/client";

interface NotifyParams {
  title: string;
  message: string;
  type: string;
  userId?: string;
  targetRole?: "admin" | "seller" | "member_admin" | "main_admin";
  link?: string;
  icon?: string;
}

/**
 * Master notification trigger
 * 1. Logs to Supabase DB (best effort – don’t block if this fails)
 * 2. Calls Edge Function (for OneSignal push + Telegram for admin)
 */
export async function triggerNotification(params: NotifyParams) {
  const { title, message, type, userId, targetRole, link, icon = "🔔" } = params;

  // 1️⃣ Log to Database (best effort – don’t block if this fails)
  try {
    await (supabase as any).from("notification_logs").insert({
      user_id: userId || null,
      target_role: targetRole || null,
      title,
      message,
      type,
      link,
      icon,
    });
  } catch (dbError) {
    console.error("[Notification] DB log failed:", dbError);
    // Continue with push notification even if DB log fails
  }

  // 2️⃣ Trigger Push via Edge Function  try {
    const { data, error } = await supabase.functions.invoke("send-notification", {
      body: {
        title,
        message,
        targetUserId: userId,
        targetRole,
        link,
        icon,
      },
    });

    if (error) {
      console.error("[Push Notification] Edge Function error:", error);
      // Fallback: try direct OneSignal API if Edge Function fails
      await fallbackOneSignalPush(title, message, userId, targetRole, link, icon);
    } else {
      console.log("[Push Notification] Sent successfully:", data);
    }
  } catch (e) {
    console.error("[Push Notification] Failed:", e);
    // Fallback to direct OneSignal API
    await fallbackOneSignalPush(title, message, userId, targetRole, link, icon);
  }
}

/* Fallback: Direct OneSignal API call (if Edge Function fails) */
async function fallbackOneSignalPush(
  title: string,
  message: string,
  userId?: string,
  targetRole?: string,
  link?: string,
  icon?: string
) {
  try {
    const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
    const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.warn("[OneSignal] Missing env vars, skipping fallback");
      return;
    }

    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      data: { link, type: "notification", timestamp: new Date().toISOString() },
    };

    // Targeting logic
    if (userId) {
      payload.include_external_user_ids = [userId];
    } else if (targetRole) {
      payload.filters = [{ field: "tag", key: "role", relation: "==", value: targetRole }];
    } else {
      payload.included_segments = ["Subscribed Users"];
    }

    const authHeader = `Basic ${btoa(`${ONESIGNAL_REST_API_KEY}:`)}`;

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("[OneSignal Fallback] Failed:", await response.json());
    }
  } catch (e) {
    console.error("[OneSignal Fallback] Error:", e);
  }
}