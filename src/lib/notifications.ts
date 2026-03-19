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

// --- Customer Notification Helpers ---

export const notifyOrderUpdate = (userId: string, orderId: string, status: string) => 
  triggerNotification({
    title: `🛒 Order ${status.toUpperCase()}`,
    message: `Your order #${orderId.slice(0,8)} is now ${status}.`,
    type: "order_status",
    userId,
    link: "/orders",
    icon: "📦"
  });

export const notifyCustomerOrder = (userId: string, status: string) =>
  triggerNotification({
    title: "🛒 Order Update",
    message: `Your order has been ${status}. Check your orders page for details.`,
    type: "order_update",
    userId,
    link: "/orders",
    icon: "📦"
  });

export const notifyCustomerOrderApproval = (userId: string, orderId: string) =>
  triggerNotification({
    title: "✅ Order Approved!",
    message: `Your order #${orderId.slice(0,8)} has been approved and is being prepared.`,
    type: "order_approval",
    userId,
    link: "/orders",
    icon: "✅"
  });

export const notifyCustomerBCoins = (userId: string, amount: number, reason: string) =>
  triggerNotification({
    title: "🪙 BCoins Earned!",
    message: `You just earned ${amount.toFixed(1)} BCoins from ${reason}!`,
    type: "bcoins_earned",
    userId,
    link: "/bcoins",
    icon: "🪙"
  });

export const notifyCustomerGCashComplete = (userId: string, type: string, amount: number, status: string) =>
  triggerNotification({
    title: `💳 GCash ${status.toUpperCase()}`,
    message: `Your ${type.replace('_', ' ')} request for ₱${amount} has been ${status}.`,
    type: "gcash_status",
    userId,
    link: "/gcash",
    icon: "💳"
  });

export const notifyCustomerRedemptionStatus = (userId: string, amount: number, status: string) =>
  triggerNotification({
    title: `🎁 Redemption ${status.toUpperCase()}`,
    message: `Your request to redeem ₱${amount} GCash has been ${status}.`,
    type: "redemption_status",
    userId,
    link: "/bcoins",
    icon: "🎁"
  });

export const notifyCustomerPrintStatus = (userId: string, fileName: string, status: string) =>
  triggerNotification({
    title: `🖨️ Print Request ${status.toUpperCase()}`,
    message: `Your print request for "${fileName}" is now ${status}.`,
    type: "print_status",
    userId,
    link: "/orders",
    icon: "🖨️"
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

export const notifyAnnouncement = (title: string, message: string) =>
  triggerNotification({
    title,
    message,
    type: "announcement",
    icon: "📢"
  });

// --- Admin Notification Helpers ---

export const notifyAdminNewRegistration = (name: string, email: string) =>
  triggerNotification({
    title: "👤 New User Registered",
    message: `${name} (${email}) just joined BizMart!`,
    type: "new_user",
    targetRole: "admin",
    link: "/admin?tab=overview",
    icon: "👤"
  });

export const notifyAdminNewPrintOrder = (name: string, file: string, total: number) =>
  triggerNotification({
    title: "🖨️ New Print Request",
    message: `${name} requested to print "${file}" (₱${total.toFixed(2)})`,
    type: "new_print",
    targetRole: "admin",
    link: "/admin?tab=print",
    icon: "🖨️"
  });

export const notifyAdminGCash = (type: string, name: string, amount: number) =>
  triggerNotification({
    title: `💳 New GCash ${type === 'cash_in' ? 'In' : 'Out'}`,
    message: `${name} requested a ₱${amount} ${type.replace('_', ' ')}.`,
    type: "new_gcash",
    targetRole: "admin",
    link: "/admin?tab=gcash",
    icon: "💳"
  });

export const notifyAdminRedemption = (name: string, amount: number) =>
  triggerNotification({
    title: "🎁 New BCoins Redemption",
    message: `${name} wants to redeem ₱${amount} GCash.`,
    type: "new_redemption",
    targetRole: "admin",
    link: "/admin?tab=bcoins",
    icon: "🎁"
  });

export const notifyAdminNewMember = (name: string) =>
  triggerNotification({
    title: "👑 New Club Member",
    message: `${name} just joined the BizMart Club!`,
    type: "new_member",
    targetRole: "admin",
    link: "/admin?tab=club",
    icon: "👑"
  });

export const sendNotification = triggerNotification;