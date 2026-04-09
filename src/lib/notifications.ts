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
    // Primary: Insert into notification_logs (triggers push notifications)
    const { error } = await (supabase as any).from("notification_logs").insert({
      title,
      message,
      type,
      user_id: userId || null,
      link: link || null,
      icon: icon || null,
      target_role: targetRole || null,
    });

    if (error) {
      console.error("[Notifications] Failed to insert into notification_logs:", error);
      
      // Fallback: Try inserting into the simpler 'notifications' table if it exists
      // This ensures the user at least sees it in the app bell if the log table is broken
      await (supabase as any).from("notifications").insert({
        title,
        message,
        type,
        user_id: userId,
      }).catch(() => {});
      
      throw error;
    }
  } catch (error) {
    console.error("[Notifications] Critical failure in sendNotification:", error);
  }
}

/**
 * Notify customer about order status changes (Products or Printing)
 */
export const notifyCustomerOrder = async (userId: string, orderId: string, status: string, isPrint: boolean = false) => {
  if (!userId) return;
  
  const prefix = isPrint ? "🖨️ Print Order" : "📦 Order";
  const statusMessages: Record<string, string> = {
    approved: `Your ${isPrint ? 'print request' : 'order'} has been approved! ${isPrint ? '🖨️' : '📦'}`,
    ready: `Your ${isPrint ? 'print' : 'order'} is ready for pickup/delivery! 🚚`,
    completed: `Your ${isPrint ? 'print' : 'order'} is completed. Thank you! 🎉`,
    rejected: `Your ${isPrint ? 'print request' : 'order'} was rejected. ❌`,
    canceled: `Your ${isPrint ? 'print request' : 'order'} has been canceled. ⚠️`
  };

  await sendNotification({
    title: `${prefix} ${status.toUpperCase()}`,
    message: statusMessages[status] || `Your order #${orderId.slice(0, 8)} is now ${status}.`,
    type: isPrint ? "print_status" : "order_status",
    userId,
    link: "/orders",
    icon: isPrint ? "🖨️" : "📦",
  });
};

/**
 * Notify customer about BCoins earned
 */
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

  // Update wallet balance
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
    console.error("[Notifications] Failed to update BCoins wallet:", error);
  }
};

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

export const notifyNewMessage = async (recipientId: string, senderName: string, content: string) => {
  if (!recipientId) return;
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
    link: "/admin",
    icon: "👑",
  });
};