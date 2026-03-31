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

// Track recent notifications to prevent duplicates
const recentNotifications = new Set<string>();
const NOTIFICATION_DEDUP_WINDOW = 5000; // 5 seconds

/**
 * Master notification trigger with lock conflict prevention
 */
export async function triggerNotification(params: NotifyParams) {
  const { title, message, type, userId, targetRole, link, icon = "🔔" } = params;

  // Create a dedup key
  const dedupKey = `${type}-${userId || 'all'}-${title}-${message.slice(0, 50)}`;
  
  // Check if we've sent this notification recently
  if (recentNotifications.has(dedupKey)) {
    return;
  }
  
  // Add to recent notifications
  recentNotifications.add(dedupKey);
  setTimeout(() => recentNotifications.delete(dedupKey), NOTIFICATION_DEDUP_WINDOW);

  try {
    // Add small random delay to prevent simultaneous inserts from causing locks
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    
    await (supabase as any).from("notification_logs").insert({
      user_id: userId || null,
      target_role: targetRole || null,
      title,
      message,
      type,
      link,
      icon,
    });
  } catch (dbError: any) {
    // Don't throw on notification failures - they're non-critical
    console.warn("[Notification] DB log failed:", dbError?.message || dbError);
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

export const notifyCustomerBCoins = (userId: string, amount: number, reason: string) =>
  triggerNotification({
    title: "🪙 BCoins Earned!",
    message: `You just earned ${amount.toFixed(1)} BCoins from ${reason}!`,
    type: "bcoins_earned",
    userId,
    link: "/bcoins",
    icon: "🪙"
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