import { supabase } from "@/integrations/supabase/client";

export async function sendNotification({
  title,
  message,
  type,
  userId,
  link,
  icon,
  targetRole,
}: {
  title: string;
  message: string;
  type: string;
  userId?: string;
  link?: string;
  icon?: string;
  targetRole?: string;
}) {
  try {
    const { error } = await (supabase as any).from("notification_logs").insert({
      title,
      message,
      type,
      user_id: userId || null,
      link: link || null,
      icon: icon || null,
      target_role: targetRole || null,
    });
    if (error) throw error;
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

export async function triggerNotification({
  title,
  message,
  type,
  userId,
  link,
  icon,
  targetRole,
}: {
  title: string;
  message: string;
  type: string;
  userId?: string;
  link?: string;
  icon?: string;
  targetRole?: string;
}) {
  return sendNotification({ title, message, type, userId, link, icon, targetRole });
}

export const notifyAdminGCash = async (type: string, userName: string, amount: number) => {
  await sendNotification({
    title: "💳 New GCash Request",
    message: `${userName} requested a ${type.replace("_", " ")} of ₱${amount}.`,
    type: "gcash_request",
    targetRole: "admin",
    link: "/admin?tab=gcash",
    icon: "💳",
  });
};

export const notifyCustomerBCoins = async (userId: string, amount: number, reason: string) => {
  await triggerNotification({
    title: "🪙 BCoins Earned!",
    message: `You just earned ${amount.toFixed(1)} BCoins from ${reason}!`,
    type: "bcoins_earned",
    userId,
    link: "/bcoins",
    icon: "🪙"
  });

  try {
    const { data: wallet } = await (supabase as any)
      .from("bcoins_wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    
    const currentBalance = Number(wallet?.balance || 0);
    const newBalance = currentBalance + amount;
    
    if (wallet) {
      await (supabase as any)
        .from("bcoins_wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    } else {
      await (supabase as any)
        .from("bcoins_wallets")
        .insert({ user_id: userId, balance: newBalance });
    }
    
    await (supabase as any).from("bcoins_transactions").insert({
      user_id: userId,
      amount: amount,
      type: "earn_gcash",
      description: reason,
    });
  } catch (error) {
    console.error("Failed to add BCoins to wallet:", error);
  }
};

export const notifyAdminRedemption = async (userName: string, amount: number) => {
  await sendNotification({
    title: "🎁 New BCoins Redemption",
    message: `${userName} redeemed ₱${amount} GCash.`,
    type: "redemption_request",
    targetRole: "admin",
    link: "/admin?tab=bcoins",
    icon: "🎁",
  });
};

export const notifyCustomerOrder = async (userId: string, status: string) => {
  await sendNotification({
    title: `📦 Order ${status.toUpperCase()}`,
    message: `Your order has been ${status}.`,
    type: "order_status",
    userId,
    link: "/orders",
    icon: "📦",
  });
};

export const notifyNewMessage = async (recipientId: string, senderName: string, content: string) => {
  await sendNotification({
    title: `💬 New message from ${senderName}`,
    message: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
    type: "new_message",
    userId: recipientId,
    link: "/messages",
    icon: "💬",
  });
};

export const notifyAdminNewMember = async (memberName: string) => {
  await sendNotification({
    title: "👑 New Club Member",
    message: `${memberName} just joined the BizMart Club!`,
    type: "new_member",
    targetRole: "admin",
    link: "/admin?tab=club",
    icon: "👑",
  });
};