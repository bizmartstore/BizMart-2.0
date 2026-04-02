// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

/**
 * Master notification trigger with lock conflict prevention
 */
export async function triggerNotification(params: NotifyParams) {
  const { title, message, type, userId, targetRole, link, icon = "🔔" } = params;

  // Create a dedup key
  const dedupKey = `${type}-${userId || 'all'}-${title}-${message.slice(0, 50)}`;
  
  // Check if we've sent this notification recently
  if (recentNotifications.has(dedupKey)) {
    return;
  }
  
  // Add to recent notifications
  recentNotifications.add(dedupKey);
  setTimeout(() => recentNotifications.delete(dedupKey), NOTIFICATION_DEDUP_WINDOW);

  try {
    // Add small random delay to prevent simultaneous inserts from causing locks
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    
    await supabase
      .from("notification_logs")
      .insert({
        user_id: userId || null,
        target_role: targetRole || null,
        title,
        message,
        type,
        link,
        icon,
      });
  } catch (dbError: any) {
    // Don't throw on notification failures - they're non-critical
    console.warn("[Notification] DB log failed:", dbError?.message || dbError);
  }
}

// ... (rest of component)