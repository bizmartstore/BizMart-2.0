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
 * Send notification via OneSignal REST API (Server-side only)
 * This function should only be called from edge functions or server components
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

  // Send via OneSignal REST API
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const oneSignalRestKey = import.meta.env.ONESIGNAL_REST_API_KEY;

    if (!oneSignalRestKey) {
      console.warn('[sendNotification] ONESIGNAL_REST_API_KEY not set');
      return;
    }

    // Build OneSignal payload
    const payload: any = {
      app_id: import.meta.env.VITE_ONESIGNAL_APP_ID || '617c000e-3cf8-4077-b083-9b4fea4018de',
      headings: { en: title },
      contents: { en: message },
      // Custom notification sound based on target
      android_sound: targetRole === 'admin' ? 'admin_notification' : 'customer_notification',
      ios_sound: targetRole === 'admin' ? 'admin_notification.mp3' : 'customer_notification.mp3',
      // Set the site URL for proper notification routing
      site_url: window.location.origin,
      // Data for deep linking
      data: {
        type,
        link,
      },
    };

    // Target specific user by external_user_id (OneSignal's user ID)
    if (targetUserId) {
      payload.include_external_user_ids = [targetUserId];
      payload.target_channel = 'push';
    } 
    // Target admins by tag
    else if (targetRole === 'admin') {
      payload.filters = [
        { field: 'tag', key: 'role', relation: '=', value: 'main_admin' },
        { operator: 'OR' },
        { field: 'tag', key: 'role', relation: '=', value: 'member_admin' },
      ];
    } 
    // Broadcast to all subscribers
    else {
      payload.included_segments = ['Subscribed Users'];
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalRestKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[sendNotification] OneSignal error:', data);
      throw new Error(data.errors?.[0]?.message || 'OneSignal notification failed');
    }

    console.log('[sendNotification] Success:', data);
  } catch (e) {
    console.warn('Failed to send push notification:', e);
  }
}

// ... rest of your notification helper functions remain the same
// They all call sendNotification() which now uses OneSignal v2