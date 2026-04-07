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
  console.log("[Notifications] Preparing notification:", { title, type, userId, targetRole });
  try {
    // 1. Insert into notification_logs
    const { error: logError } = await (supabase as any).from("notification_logs").insert({
      title,
      message,
      type,
      user_id: userId || null,
      link: link || null,
      icon: icon || null,
      target_role: targetRole || null,
    });
    if (logError) throw logError;
    console.log("[Notifications] ✅ Log inserted into DB successfully");

    // 2. Trigger push notification if userId is provided
    if (userId) {
      await triggerPushNotification(userId, title, message, link, icon);
    }
  } catch (error) {
    console.error("[Notifications] ❌ Failed to send notification:", error);
  }
}

async function triggerPushNotification(userId: string, title: string, body: string, url?: string, icon?: string) {
  try {
    console.log("[Notifications] 📡 Triggering push for user:", userId);
    
    // Fetch FCM token
    const { data: tokens, error: tokenError } = await (supabase as any)
      .from("user_push_tokens")
      .select("fcm_token")
      .eq("user_id", userId)
      .limit(1);

    if (tokenError) throw tokenError;
    if (!tokens || tokens.length === 0) {
      console.warn("[Notifications] ⚠️ No FCM token found for user:", userId);
      return;
    }

    // Call edge function
    console.log("[Notifications] 🚀 Invoking send-push-notification edge function...");
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        userId,
        title,
        body,
        icon: icon || "/pwa-192x192.png",
        url: url || "/",
      },
    });

    if (error) throw error;
    console.log("[Notifications] ✅ Push notification sent successfully:", data);
  } catch (error) {
    console.error("[Notifications] ❌ Failed to trigger push:", error);
  }
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