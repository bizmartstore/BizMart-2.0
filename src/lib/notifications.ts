import { supabase } from "@/integrations/supabase/client";

// Notification helper functions
export async function notifyNewMessage(recipientId: string, senderName: string, content: string) {
  const title = `New message from ${senderName}`;
  const message = content.length > 100 ? content.substring(0, 97) + '...' : content;
  
  // Insert into notification_logs
  const { error } = await supabase
    .from("notification_logs")
    .insert({
      user_id: recipientId,
      title,
      message,
      type: "message",
      icon: "💬",
      is_read: false,
    });
  
  if (error) console.error("Failed to create notification:", error);
}

export async function notifyAdminNewMember(memberName: string) {
  // Get all admin users
  const { data: admins } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["main_admin", "member_admin"]);
  
  if (!admins) return;
  
  const notifications = admins.map(admin => ({
    user_id: admin.user_id,
    title: "New Club Member!",
    message: `${memberName} just joined BizMart Club!`,
    type: "club",
    icon: "👑",
    is_read: false,
  }));
  
  const { error } = await supabase
    .from("notification_logs")
    .insert(notifications);
  
  if (error) console.error("Failed to send admin notification:", error);
}

export async function notifyAdminRedemption(userName: string, amount: number) {
  const { data: admins } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["main_admin", "member_admin"]);
  
  if (!admins) return;
  
  const notifications = admins.map(admin => ({
    user_id: admin.user_id,
    title: "BCoins Redemption Request",
    message: `${userName} requested ₱${amount} GCash`,
    type: "bcoins",
    icon: "🎁",
    is_read: false,
  }));
  
  const { error } = await supabase
    .from("notification_logs")
    .insert(notifications);
  
  if (error) console.error("Failed to send redemption notification:", error);
}

export async function notifyAdminGCash(type: string, userName: string, amount: number) {
  const { data: admins } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["main_admin", "member_admin"]);
  
  if (!admins) return;
  
  const notifications = admins.map(admin => ({
    user_id: admin.user_id,
    title: `GCash ${type === 'cash_in' ? 'In' : 'Out'} Request`,
    message: `${userName} requested ₱${amount} via GCash`,
    type: "gcash",
    icon: "💳",
    is_read: false,
  }));
  
  const { error } = await supabase
    .from("notification_logs")
    .insert(notifications);
  
  if (error) console.error("Failed to send GCash notification:", error);
}

export async function notifyCustomerBCoins(userId: string, amount: number, reason: string) {
  const { error } = await supabase
    .from("notification_logs")
    .insert({
      user_id: userId,
      title: "BCoins Earned!",
      message: `You earned +${amount} BCoins for ${reason}`,
      type: "bcoins",
      icon: "🪙",
      is_read: false,
    });
  
  if (error) console.error("Failed to send BCoins notification:", error);
}

// Send push notification via FCM
export async function sendPushNotification(userId: string, title: string, body: string, type: string) {
  try {
    // Get user's role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    if (roleData?.role !== "customer") return;
    
    // Get FCM tokens
    const { data: tokens } = await supabase
      .from("user_push_tokens")
      .select("fcm_token")
      .eq("user_id", userId);
    
    if (!tokens || tokens.length === 0) return;
    
    // Send push via Supabase Edge Function
    const { error } = await supabase.functions.invoke("send-push", {
      body: {
        tokens: tokens.map(t => t.fcm_token),
        title,
        body,
        type,
      },
    });
    
    if (error) console.error("Push notification failed:", error);
  } catch (e) {
    console.error("Push notification error:", e);
  }
}