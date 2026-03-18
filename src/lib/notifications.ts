import { supabase } from "@/integrations/supabase/client";

interface NotifyParams {
  title: string;
  message: string;
  icon?: string;
  link?: string;
  type: string;
  targetRole?: "admin" | null;
  targetUserId?: string | null;
}

/**
 * Send a push notification via the edge function AND log it to notification_logs.
 */
export async function sendNotification(params: NotifyParams) {
  const { title, message, icon = "🔔", link = "/", type, targetRole, targetUserId } = params;

  // Log to notification_logs table
  try {
    await (supabase as any).from("notification_logs").insert({
      type,
      title,
      message,
      icon,
      link,
      target_role: targetRole || null,
      target_user_id: targetUserId || null,
    });
  } catch (e) {
    console.warn("Failed to log notification:", e);
  }

  // Call edge function directly via fetch
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const res = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ title, message, icon, link, type, targetRole, targetUserId }),
    });

    const data = await res.json();
    console.log("[sendNotification] Edge function response:", data);
    return data;
  } catch (e) {
    console.warn("Failed to send push notification:", e);
    return null;
  }
}

/** Notify admins about a new GCash transaction */
export async function notifyAdminGCash(type: "cash_in" | "cash_out", studentName: string, amount: number) {
  const label = type === "cash_in" ? "Cash In" : "Cash Out";
  return sendNotification({
    title: `💰 New GCash ${label}`,
    message: `${studentName} requested ₱${amount} ${label}`,
    icon: "💰",
    link: "/admin?tab=gcash",
    type: `gcash_${type}`,
    targetRole: "admin",
  });
}

/** Notify admins about new club member */
export async function notifyAdminNewMember(memberName: string) {
  return sendNotification({
    title: "👑 New BizMart Club Member",
    message: `${memberName} has joined BizMart Club!`,
    icon: "👑",
    link: "/admin?tab=club",
    type: "new_member",
    targetRole: "admin",
  });
}

/** Notify admins about BCoins redemption */
export async function notifyAdminRedemption(studentName: string, amount: number) {
  return sendNotification({
    title: "🎁 BCoins Redemption Request",
    message: `${studentName} wants to redeem ₱${amount} GCash`,
    icon: "🎁",
    link: "/admin?tab=bcoins",
    type: "bcoins_redemption",
    targetRole: "admin",
  });
}

/** Notify customer about order status */
export async function notifyCustomerOrder(userId: string, status: "placed" | "ready" | "completed") {
  const messages = {
    placed: "Your order has been successfully placed. ✅",
    ready: "Your order is ready for pickup! 📦",
    completed: "Your order is completed. Thank you! 🎉",
  };
  return sendNotification({
    title: `🛒 Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: messages[status],
    icon: "🛒",
    link: "/profile",
    type: `order_${status}`,
    targetUserId: userId,
  });
}

/** Notify customer about BCoins earned */
export async function notifyCustomerBCoins(userId: string, amount: number, reason: string) {
  return sendNotification({
    title: "🪙 BCoins Earned!",
    message: `You earned ${amount.toFixed(1)} BCoins from ${reason}`,
    icon: "🪙",
    link: "/bcoins",
    type: "bcoins_earned",
    targetUserId: userId,
  });
}

/** Notify customer about GCash transaction completed */
export async function notifyCustomerGCashComplete(userId: string, type: "cash_in" | "cash_out", amount: number, status: string) {
  const label = type === "cash_in" ? "Cash In" : "Cash Out";
  return sendNotification({
    title: `💰 GCash ${label} ${status === "completed" ? "Completed" : "Rejected"}`,
    message: `Your ₱${amount} ${label} has been ${status}.`,
    icon: "💰",
    link: "/gcash",
    type: "gcash_status",
    targetUserId: userId,
  });
}

/** Notify admins about new user registration */
export async function notifyAdminNewRegistration(studentName: string, email: string) {
  return sendNotification({
    title: "🎓 New Student Registered",
    message: `${studentName} (${email}) just created an account!`,
    icon: "🎓",
    link: "/admin?tab=users",
    type: "new_registration",
    targetRole: "admin",
  });
}

/** Notify customer about BCoins redemption status */
export async function notifyCustomerRedemptionStatus(userId: string, amount: number, status: string) {
  return sendNotification({
    title: `🎁 Redemption ${status === "completed" ? "Approved" : "Rejected"}`,
    message: `Your ₱${amount} GCash redemption has been ${status}.`,
    icon: "🎁",
    link: "/bcoins",
    type: "redemption_status",
    targetUserId: userId,
  });
}

/** Notify admins about new print order */
export async function notifyAdminNewPrintOrder(studentName: string, fileName: string, cost: number) {
  return sendNotification({
    title: "🖨️ New Print Request",
    message: `${studentName} submitted a print request "${fileName}" — ₱${cost.toFixed(2)}`,
    icon: "🖨️",
    link: "/admin?tab=print",
    type: "new_print_order",
    targetRole: "admin",
  });
}

/** Notify user about a new message */
export async function notifyNewMessage(recipientUserId: string, senderName: string, preview: string) {
  return sendNotification({
    title: `💬 New message from ${senderName}`,
    message: preview.length > 80 ? preview.slice(0, 80) + "…" : preview,
    icon: "💬",
    link: "/messages",
    type: "new_message",
    targetUserId: recipientUserId,
  });
}

/** Notify all users about a new announcement */
export async function notifyAnnouncement(title: string, message: string) {
  return sendNotification({
    title: `📢 ${title}`,
    message,
    icon: "📢",
    link: "/",
    type: "announcement",
  });
}

/** Notify customer about print order approval/rejection/cancel/confirmation */
export async function notifyCustomerPrintStatus(userId: string, fileName: string, status: string) {
  const titles: Record<string, string> = {
    approved: "🖨️ Print Order Approved",
    rejected: "❌ Print Order Rejected",
    canceled: "🚫 Print Order Canceled",
    confirmed: "✅ Print Order Confirmed",
  };
  const icons: Record<string, string> = {
    approved: "🖨️",
    rejected: "❌",
    canceled: "🚫",
    confirmed: "✅",
  };
  return sendNotification({
    title: titles[status] || `🖨️ Print Order ${status}`,
    message: `Your print order "${fileName}" has been ${status}.`,
    icon: icons[status] || "🖨️",
    link: "/orders",
    type: "print_status",
    targetUserId: userId,
  });
}

/** Notify customer about order approval/rejection */
export async function notifyCustomerOrderApproval(userId: string, orderId: string, status: string) {
  const messages: Record<string, string> = {
    approved: "Your order has been approved and is being prepared! ✅",
    rejected: "Your order has been rejected. ❌",
    completed: "Your order is completed. Thank you! 🎉",
  };
  return sendNotification({
    title: `🛒 Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: messages[status] || `Your order status changed to ${status}.`,
    icon: "🛒",
    link: "/orders",
    type: `order_${status}`,
    targetUserId: userId,
  });
}

/** Notify about out-of-stock product */
export async function notifyOutOfStock(productName: string) {
  return sendNotification({
    title: "⚠️ Product Out of Stock",
    message: `"${productName}" is now out of stock! Please restock.`,
    icon: "⚠️",
    link: "/admin?tab=products",
    type: "out_of_stock",
    targetRole: "admin",
  });
}