import { supabase } from "@/integrations/supabase/client";

interface NotifyParams {
  title: string;
  message: string;
  type: string;
  userId?: string;
  targetRole?: "admin" | "seller";
  link?: string;
  icon?: string;
}

/**
 * The Master Notification Trigger
 * 1. Logs to Supabase DB (for the in-app bell)
 * 2. Calls Edge Function (for OneSignal Push)
 */
export async function triggerNotification(params: NotifyParams) {
  const { title, message, type, userId, targetRole, link, icon = "🔔" } = params;

  // 1. Log to Database
  const { error: dbError } = await (supabase as any).from("notification_logs").insert({
    user_id: userId || null,
    target_role: targetRole || null,
    title,
    message,
    type,
    link,
    icon,
  });

  if (dbError) console.error("DB Notification Log failed:", dbError);

  // 2. Trigger Push via Edge Function
  try {
    const { data, error: pushError } = await supabase.functions.invoke("send-notification", {
      body: { title, message, targetUserId: userId, targetRole, link, icon },
    });
    if (pushError) throw pushError;
  } catch (e) {
    console.warn("Push notification failed (User might be offline/unsubscribed):", e);
  }
}

// --- Specific Event Helpers ---

export const notifyOrderUpdate = (userId: string, orderId: string, status: string) => 
  triggerNotification({
    title: `🛒 Order ${status.toUpperCase()}`,
    message: `Your order #${orderId.slice(0,8)} is now ${status}.`,
    type: "order_status",
    userId,
    link: "/orders",
    icon: "📦"
  });

export const notifyNewMessage = (recipientId: string, senderName: string, text: string) =>
  triggerNotification({
    title: `💬 New Message from ${senderName}`,
    message: text.length > 60 ? text.slice(0, 60) + "..." : text,
    type: "chat",
    userId: recipientId,
    link: "/messages",
    icon: "💬"
  });