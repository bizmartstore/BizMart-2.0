import { supabase } from "@/integrations/supabase/client";

const VALID_ROLES = ["main_admin", "member_admin", "customer"];

export async function sendNotification({
  title,
  message,
  type,
  userId,
  link,
  icon,
  targetRole,
  sendPush = true,
}: {
  title: string;
  message: string;
  type: string;
  userId?: string;
  link?: string;
  icon?: string;
  targetRole?: string;
  sendPush?: boolean;
}) {
  try {
    let validatedRole = targetRole || null;
    if (validatedRole && !VALID_ROLES.includes(validatedRole)) {
      validatedRole = null;
    }

    // 1. Save to database for the in-app notification bell
    const { data, error } = await (supabase as any).from("notification_logs").insert({
      title,
      message,
      type,
      user_id: userId || null,
      link: link || null,
      icon: icon || null,
      target_role: validatedRole,
    }).select().single();

    if (error) throw error;

    // 2. Trigger Push Notification via Edge Function
    if (sendPush && userId) {
      supabase.functions.invoke("send-push", {
        body: { userId, title, message, link, icon }
      }).catch(err => console.error("[Notifications] Push trigger failed:", err));
    } else if (sendPush && validatedRole) {
      // For role-based notifications (admins), we fetch tokens for those roles in the Edge Function
      supabase.functions.invoke("send-push", {
        body: { targetRole: validatedRole, title, message, link, icon }
      }).catch(err => console.error("[Notifications] Role push failed:", err));
    }

    return data;
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

export const notifyAdminGCash = async (type: string, userName: string, amount: number) => {
  await sendNotification({
    title: "💳 New GCash Request",
    message: `${userName} requested a ${type.replace("_", " ")} of ₱${amount}.`,
    type: "gcash_request",
    targetRole: "main_admin",
    link: "/admin",
    icon: "💳"
  });
};

export const notifyAdminNewOrder = async (userName: string, total: number) => {
  await sendNotification({
    title: "📦 New Order Received",
    message: `${userName} just placed an order for ₱${total.toFixed(2)}.`,
    type: "new_order",
    targetRole: "main_admin",
    link: "/admin",
    icon: "📦"
  });
};

export const notifyAdminNewPrintOrder = async (userName: string, cost: number) => {
  await sendNotification({
    title: "🖨️ New Print Order",
    message: `${userName} submitted a print request for ₱${cost.toFixed(2)}.`,
    type: "new_print_order",
    targetRole: "main_admin",
    link: "/admin",
    icon: "🖨️"
  });
};

export const notifyCustomerBCoins = async (userId: string, amount: number, reason: string) => {
  if (!userId) return;
  await sendNotification({
    title: "🪙 BCoins Earned!",
    message: `You earned ${amount.toFixed(1)} BCoins from ${reason}!`,
    type: "bcoins_earned",
    userId,
    link: "/bcoins",
    icon: "🪙"
  });
  const { data: wallet } = await (supabase as any).from("bcoins_wallets").select("balance").eq("user_id", userId).maybeSingle();
  const currentBalance = Number(wallet?.balance || 0);
  if (wallet) {
    await (supabase as any).from("bcoins_wallets").update({ balance: currentBalance + amount, updated_at: new Date().toISOString() }).eq("user_id", userId);
  } else {
    await (supabase as any).from("bcoins_wallets").insert({ user_id: userId, balance: amount });
  }
  await (supabase as any).from("bcoins_transactions").insert({ user_id: userId, amount, type: "earned", description: reason });
};

export const notifyAdminRedemption = async (userName: string, amount: number) => {
  await sendNotification({
    title: "🎁 New BCoins Redemption",
    message: `${userName} redeemed ₱${amount} GCash.`,
    type: "redemption_request",
    targetRole: "main_admin",
    link: "/admin",
    icon: "🎁"
  });
};

export const notifyCustomerOrder = async (userId: string, orderId: string, status: string) => {
  if (!userId) return;
  const statusMessages: Record<string, string> = {
    approved: "Your order is being prepared! 📦",
    ready: "Your order is ready! 🚚",
    completed: "Order completed. Thank you! 🎉",
    rejected: "Your order was rejected. ❌"
  };
  await sendNotification({
    title: `📦 Order ${status.toUpperCase()}`,
    message: statusMessages[status] || `Your order #${orderId.slice(0, 8)} is now ${status}.`,
    type: "order_status",
    userId,
    link: "/orders",
    icon: "📦"
  });
};

export const notifyNewMessage = async (recipientId: string, senderName: string, content: string) => {
  if (!recipientId) return;
  await sendNotification({
    title: `💬 New message from ${senderName}`,
    message: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
    type: "new_message",
    userId: recipientId,
    link: "/messages",
    icon: "💬"
  });
};

export const notifyAdminNewMember = async (memberName: string) => {
  await sendNotification({
    title: "👑 New Club Member",
    message: `${memberName} just joined the Club!`,
    type: "new_member",
    targetRole: "main_admin",
    link: "/admin",
    icon: "👑"
  });
};