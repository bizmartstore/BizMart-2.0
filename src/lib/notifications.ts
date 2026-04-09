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
    link: "/admin",
    icon: "💳",
  });
};

export const notifyCustomerBCoins = async (userId: string, amount: number, reason: string) => {
  if (!userId) return;
  
  await sendNotification({
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
    link: "/admin",
    icon: "🎁",
  });
};

export const notifyCustomerOrder = async (userId: string, statusMsg: string) => {
  await sendNotification({
    title: "📦 Order Status Update",
    message: statusMsg,
    type: "order_status",
    userId,
    link: "/orders",
    icon: "📦",
  });
};