import { supabase } from "@/integrations/supabase/client";

interface NotifyParams {
  title: string;
  message: string;
  type: string;
  userId?: string;
  targetUserId?: string; // Alias for userId used in some components
  targetRole?: "admin" | "seller";
  role?: "admin" | "seller"; // Alias for targetRole
  link?: string;
  icon?: string;
}

/**
 * The Master Notification Trigger
 * 1. Logs to Supabase DB (for the in-app bell)
 * 2. Calls Edge Function (for OneSignal Push)
 */
export async function triggerNotification(params: NotifyParams) {
  const { title, message, type, userId, targetUserId, role, targetRole, link, icon = "🔔" } = params;
  const finalUserId = userId || targetUserId;
  const finalRole = role || targetRole;

  // 1. Log to Database
  const { error: dbError } = await (supabase as any).from("notification_logs").insert({
    user_id: finalUserId || null,
    target_role: finalRole || null,
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
      body: { title, message, targetUserId: finalUserId, targetRole: finalRole, link, icon },
    });
    if (pushError) throw pushError;
  } catch (e) {
    console.warn("Push notification failed (User might be offline/unsubscribed):", e);
  }
}

// Alias for triggerNotification used in many components
export const sendNotification = triggerNotification;

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

export const notifyCustomerOrder = (userId: string, status: string) =>
  triggerNotification({
    title: status === "placed" ? "🛒 Order Placed!" : "📦 Order Update",
    message: status === "placed" 
      ? "Your order has been received and is waiting for admin approval."
      : `Your order status has been updated to ${status}.`,
    type: "order_status",
    userId,
    link: "/orders",
    icon: "🛍️"
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

export const notifyAdminGCash = (type: string, userName: string, amount: number) =>
  triggerNotification({
    title: `💰 New GCash ${type === 'cash_in' ? 'Cash In' : 'Cash Out'}`,
    message: `${userName} requested ₱${amount}`,
    type: "admin_alert",
    role: "admin",
    link: "/admin?tab=gcash",
    icon: "💳"
  });

export const notifyAdminRedemption = (userName: string, amount: number) =>
  triggerNotification({
    title: "🎁 New BCoins Redemption",
    message: `${userName} wants to redeem ₱${amount} GCash`,
    type: "admin_alert",
    role: "admin",
    link: "/admin?tab=bcoins",
    icon: "🎁"
  });

export const notifyAdminNewMember = (memberName: string) =>
  triggerNotification({
    title: "👑 New Club Member!",
    message: `${memberName} just joined the BizMart Club.`,
    type: "admin_alert",
    role: "admin",
    link: "/admin?tab=club",
    icon: "👑"
  });

export const notifyAdminNewPrintOrder = (studentName: string, fileName: string, amount: number) =>
  triggerNotification({
    title: "🖨️ New Print Request",
    message: `${studentName} uploaded "${fileName}" (₱${amount.toFixed(2)})`,
    type: "admin_alert",
    role: "admin",
    link: "/admin?tab=print",
    icon: "🖨️"
  });

export const notifyAdminNewRegistration = (name: string, email: string) =>
  triggerNotification({
    title: "👤 New User Registered",
    message: `${name} (${email}) just created an account.`,
    type: "admin_alert",
    role: "admin",
    link: "/admin?tab=overview",
    icon: "👤"
  });

export const notifyAnnouncement = (title: string, message: string) =>
  triggerNotification({
    title: `📢 ${title}`,
    message,
    type: "announcement",
    link: "/",
    icon: "📢"
  });

export const notifyCustomerPrintStatus = (userId: string, fileName: string, status: string) =>
  triggerNotification({
    title: "🖨️ Print Request Update",
    message: `Your request for "${fileName}" is now ${status}.`,
    type: "print_status",
    userId,
    link: "/orders",
    icon: "📄"
  });

export const notifyCustomerOrderApproval = (userId: string, orderId: string) =>
  triggerNotification({
    title: "✅ Order Approved!",
    message: `Your order #${orderId.slice(0,8)} has been approved by the admin.`,
    type: "order_status",
    userId,
    link: "/orders",
    icon: "✅"
  });

export const notifyCustomerGCashComplete = (userId: string, type: string, amount: number, status: string) =>
  triggerNotification({
    title: status === 'completed' ? "✅ GCash Request Approved" : "❌ GCash Request Rejected",
    message: `Your ₱${amount} ${type === 'cash_in' ? 'Cash In' : 'Cash Out'} request has been ${status}.`,
    type: "gcash_status",
    userId,
    link: "/gcash",
    icon: status === 'completed' ? "💰" : "❌"
  });

export const notifyCustomerRedemptionStatus = (userId: string, amount: number, status: string) =>
  triggerNotification({
    title: status === 'completed' ? "🎁 Redemption Approved" : "❌ Redemption Rejected",
    message: `Your ₱${amount} GCash redemption has been ${status}.`,
    type: "redemption_status",
    userId,
    link: "/bcoins",
    icon: status === 'completed' ? "🎁" : "❌"
  });