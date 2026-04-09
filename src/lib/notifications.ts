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

/**
 * Notify admins about a new GCash request
 */
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

/**
 * Notify customer about BCoins earned
 */
export const notifyCustomerBCoins = async (userId: string, amount: number, reason: string) => {
  if (!userId) return;
  
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

/**
 * Notify admins about a new BCoins redemption
 */
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

/**
 * Notify customer about order status changes with push notification
 */
export const notifyCustomerOrder = async (userId: string, orderId: string, status: string) => {
  if (!userId) return;
  
  const statusMessages: Record<string, string> = {
    approved: "Your order has been approved and is being prepared! 📦",
    ready: "Your order is ready for pickup/delivery! 🚚",
    completed: "Your order has been completed. Thank you for shopping! 🎉",
    rejected: "Your order was unfortunately rejected. Please contact support. ❌",
    canceled: "Your order has been canceled. ⚠️"
  };

  const statusTitles: Record<string, string> = {
    approved: "📦 Order Approved",
    ready: "🚚 Order Ready",
    completed: "🎉 Order Completed",
    rejected: "❌ Order Rejected",
    canceled: "⚠️ Order Canceled"
  };

  // Send database notification
  await sendNotification({
    title: statusTitles[status] || `📦 Order ${status.toUpperCase()}`,
    message: statusMessages[status] || `Your order #${orderId.slice(0, 8)} is now ${status}.`,
    type: "order_status",
    userId,
    link: "/orders",
    icon: "📦",
  });

  // Send push notification
  await sendPushNotification(userId, {
    title: statusTitles[status] || `📦 Order ${status.toUpperCase()}`,
    body: statusMessages[status] || `Your order #${orderId.slice(0, 8)} is now ${status}.`,
    data: {
      orderId,
      status,
      link: "/orders"
    }
  });
};

/**
 * Send push notification to a specific user
 */
export const sendPushNotification = async (userId: string, payload: { title: string; body: string; data?: any }) => {
  try {
    // Get user's FCM tokens
    const { data: tokens, error } = await (supabase as any)
      .from("fcm_tokens")
      .select("token")
      .eq("user_id", userId);
    
    if (error) {
      console.error("Error fetching FCM tokens:", error);
      return;
    }

    if (!tokens || tokens.length === 0) {
      console.log("No FCM tokens found for user");
      return;
    }

    // Send push notification to each token
    for (const tokenRecord of tokens) {
      try {
        const response = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Authorization": `key=${import.meta.env.VITE_FCM_SERVER_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            to: tokenRecord.token,
            notification: {
              title: payload.title,
              body: payload.body,
              icon: "/pwa-192x192.png",
              badge: "/pwa-192x192.png"
            },
            data: payload.data || {}
          })
        });

        if (!response.ok) {
          console.error("FCM error response:", await response.text());
        }
      } catch (err) {
        console.error("Error sending FCM message:", err);
      }
    }
  } catch (error) {
    console.error("Error in sendPushNotification:", error);
  }
};

/**
 * Notify customer about a new message
 */
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

/**
 * Notify admins about a new club member
 */
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