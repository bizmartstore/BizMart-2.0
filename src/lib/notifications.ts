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
 * Send notification via OneSignal through Supabase Edge Function
 * This keeps the OneSignal REST API key secure on the server
 */
export async function sendNotification(params: NotifyParams) {
  const { title, message, icon = "🔔", link = "/", type, targetRole, targetUserId } = params;

  // Log to notification_logs table (best effort)
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

  // Call edge function to send push notification
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        title,
        message,
        icon,
        link,
        type,
        targetRole,
        targetUserId,
      },
    });

    if (error) {
      console.error('[sendNotification] Edge function error:', error);
      throw error;
    }

    console.log('[sendNotification] Success:', data);
  } catch (e) {
    console.warn('Failed to send push notification via edge function:', e);
  }
}

// Notify admin about new order
export async function notifyAdminOrder(order: any, customerName: string) {
  const items = order.items || [];
  const totalQty = items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
  const method = order.delivery_type === "delivery" ? "🚚 Delivery" : "📦 Pickup";
  
  await sendNotification({
    title: "🛒 New Purchase Order",
    message: `${customerName} placed a ${method} order for ₱${Number(order.total).toLocaleString()} (${items.length} items, ${totalQty} total) — ${order.pickup_date} ${order.pickup_time}`,
    icon: "🛒",
    link: "/admin?tab=orders",
    type: "new_order",
    targetRole: "admin",
  });
}

// Notify customer about their order status
export async function notifyCustomerOrder(userId: string, status: string) {
  const messages: Record<string, string> = {
    placed: "Your order has been placed! We'll review it shortly. 🛒",
    approved: "Your order has been approved! 🎉",
    completed: "Your order has been completed! 🎉",
    rejected: "Your order has been rejected. Please contact support.",
  };

  const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", userId).single();
  const name = profile ? `${profile.first_name} ${profile.last_name}` : "Customer";

  await sendNotification({
    title: "📦 Order Update",
    message: messages[status] || "Your order status has been updated.",
    icon: "📦",
    link: "/orders",
    type: "order_status",
    targetUserId: userId,
  });
}

// Notify admin about new GCash transaction
export async function notifyAdminGCash(type: string, userName: string, amount: number) {
  await sendNotification({
    title: type === "cash_in" ? "💰 GCash Cash In Request" : "💸 GCash Cash Out Request",
    message: `${userName} requested ₱${amount} ${type === "cash_in" ? "cash in" : "cash out"}. Check admin panel!`,
    icon: type === "cash_in" ? "💰" : "💸",
    link: "/admin?tab=gcash",
    type: "gcash_request",
    targetRole: "admin",
  });
}

// Notify customer about GCash transaction completion
export async function notifyCustomerGCashComplete(userId: string, type: string, amount: number, status: string) {
  if (status === "completed") {
    await sendNotification({
      title: "✅ GCash Transaction Completed",
      message: `Your ₱${amount} ${type === "cash_in" ? "cash in" : "cash out"} has been processed!`,
      icon: "✅",
      link: "/gcash",
      type: "gcash_completed",
      targetUserId: userId,
    });
  }
}

// Notify admin about new BCoins redemption
export async function notifyAdminRedemption(userName: string, gcashAmount: number) {
  await sendNotification({
    title: "🪙 BCoins Redemption Request",
    message: `${userName} wants to redeem ₱${gcashAmount} GCash. Approve in admin panel!`,
    icon: "🪙",
    link: "/admin?tab=bcoins",
    type: "bcoins_redemption",
    targetRole: "admin",
  });
}

// Notify customer about BCoins redemption status
export async function notifyCustomerRedemptionStatus(userId: string, gcashAmount: number, status: string) {
  await sendNotification({
    title: status === "completed" ? "✅ Redemption Approved!" : "❌ Redemption Rejected",
    message: `Your ₱${gcashAmount} GCash redemption has been ${status}.`,
    icon: status === "completed" ? "✅" : "❌",
    link: "/bcoins",
    type: "redemption_status",
    targetUserId: userId,
  });
}

// Notify admin about new print order
export async function notifyAdminNewPrintOrder(studentName: string, fileName: string, total: number) {
  await sendNotification({
    title: "🖨️ New Print Order",
    message: `${studentName} submitted "${fileName}" for printing. Total: ₱${total.toFixed(2)}`,
    icon: "🖨️",
    link: "/admin?tab=print",
    type: "new_print_order",
    targetRole: "admin",
  });
}

// Notify customer about print order status
export async function notifyCustomerPrintStatus(userId: string, fileName: string, status: string) {
  const messages: Record<string, string> = {
    approved: `Your print order for "${fileName}" has been approved!`,
    confirmed: `Your print order for "${fileName}" is ready for pickup!`,
    rejected: `Your print order for "${fileName}" was rejected.`,
    canceled: `Your print order for "${fileName}" was canceled.`,
  };

  await sendNotification({
    title: "🖨️ Print Order Update",
    message: messages[status] || `Your print order status has been updated to: ${status}`,
    icon: "🖨️",
    link: "/orders?tab=print",
    type: "print_order_status",
    targetUserId: userId,
  });
}

// Notify admin about new BizMart Club member
export async function notifyAdminNewMember(memberName: string) {
  await sendNotification({
    title: "🎉 New BizMart Club Member!",
    message: `${memberName} just joined the BizMart Club! 🥳`,
    icon: "🎉",
    link: "/admin?tab=club",
    type: "new_club_member",
    targetRole: "admin",
  });
}

// Notify admin about new seller registration
export async function notifyAdminNewSeller(sellerName: string, storeName: string) {
  await sendNotification({
    title: "🏪 New Seller Application",
    message: `${sellerName} wants to open "${storeName}" on BizMart!`,
    icon: "🏪",
    link: "/admin?tab=sellers",
    type: "new_seller",
    targetRole: "admin",
  });
}

// Notify customer about BCoins earned
export async function notifyCustomerBCoins(userId: string, amount: number, reason: string) {
  await sendNotification({
    title: "🪙 BCoins Earned!",
    message: `You earned ${amount.toFixed(1)} BCoins from ${reason}!`,
    icon: "🪙",
    link: "/bcoins",
    type: "bcoins_earned",
    targetUserId: userId,
  });
}

// Notify admin about new announcement
export async function notifyAnnouncement(title: string, message: string) {
  await sendNotification({
    title: "📢 New Announcement",
    message: `${title}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
    icon: "📢",
    link: "/",
    type: "announcement",
    // Broadcast to all users
  });
}

// Notify about new message
export async function notifyNewMessage(recipientId: string, senderName: string, message: string) {
  await sendNotification({
    title: "💬 New Message",
    message: `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
    icon: "💬",
    link: "/messages",
    type: "new_message",
    targetUserId: recipientId,
  });
}

// Notify customer about order approval
export async function notifyCustomerOrderApproval(userId: string, orderId: string, status: string) {
  const messages = {
    approved: "Your order has been approved and is being prepared! 🎉",
    completed: "Your order has been completed! Thank you for shopping! 🎉",
    rejected: "Your order has been rejected. Please contact support.",
  };

  await sendNotification({
    title: "📦 Order Status Update",
    message: messages[status as keyof typeof messages] || `Order #${orderId.slice(0, 8)} status: ${status}`,
    icon: "📦",
    link: "/orders",
    type: "order_approval",
    targetUserId: userId,
  });
}

// Notify about club membership activation
export async function notifyCustomerClubActivation(userId: string, controlNumber: string) {
  await sendNotification({
    title: "🎉 Welcome to BizMart Club!",
    message: `Your membership is active! Control #: ${controlNumber}`,
    icon: "🎉",
    link: "/club",
    type: "club_activation",
    targetUserId: userId,
  });
}

// Notify about seller code sent
export async function notifySellerCodeSent(userId: string, code: string) {
  await sendNotification({
    title: "🏪 Seller Code Received",
    message: `Your seller code is: ${code}. Use it to activate your seller account!`,
    icon: "🏪",
    link: "/club",
    type: "seller_code",
    targetUserId: userId,
  });
}