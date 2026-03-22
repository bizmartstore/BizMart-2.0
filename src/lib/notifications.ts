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

/**
 * Master notification trigger
 * 1. Logs to Supabase DB (for in-app bell)
 * 2. Calls Edge Function (for OneSignal push + Telegram for admin)
 */
export async function triggerNotification(params: NotifyParams) {
  const { title, message, type, userId, targetRole, link, icon = "🔔" } = params;

  // 1. Log to Database (best effort - don't block if this fails)
  try {
    await (supabase as any).from("notification_logs").insert({
      user_id: userId || null,
      target_role: targetRole || null,
      title,
      message,
      type,
      link,
      icon,
    });
  } catch (dbError) {
    console.error("[Notification] DB log failed:", dbError);
    // Continue with push notification even if DB log fails
  }

  // 2. Trigger Push via Edge Function
  try {
    const { data, error } = await supabase.functions.invoke("send-notification", {
      body: { 
        title, 
        message, 
        targetUserId: userId, 
        targetRole, 
        link, 
        icon 
      },
    });

    if (error) {
      console.error("[Push Notification] Edge Function error:", error);
      // Fallback: try direct OneSignal API if Edge Function fails
      await fallbackOneSignalPush(title, message, userId, targetRole, link, icon);
    } else {
      console.log("[Push Notification] Sent successfully:", data);
    }
  } catch (e) {
    console.error("[Push Notification] Failed:", e);
    // Fallback to direct OneSignal API
    await fallbackOneSignalPush(title, message, userId, targetRole, link, icon);
  }
}

// Fallback: Direct OneSignal API call (if Edge Function fails)
async function fallbackOneSignalPush(
  title: string, 
  message: string, 
  userId?: string, 
  targetRole?: string, 
  link?: string, 
  icon?: string
) {
  try {
    const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
    const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;
    
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.warn("[OneSignal] Missing env vars, skipping fallback");
      return;
    }

    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      data: { link, type: "notification" },
    };

    if (userId) {
      payload.include_external_user_ids = [userId];
    } else if (targetRole) {
      payload.filters = [{ field: "tag", key: "role", relation: "==", value: targetRole }];
    } else {
      payload.included_segments = ["Subscribed Users"];
    }

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("[OneSignal Fallback] Failed:", await response.json());
    }
  } catch (e) {
    console.error("[OneSignal Fallback] Error:", e);
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