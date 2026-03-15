/**
 * Edge Function: Send Push Notification via OneSignal
 * This runs server-side and uses OneSignal REST API
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, message, icon, link, type, targetRole, targetUserId } = await req.json();

    // Get OneSignal credentials from environment
    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID")!;
    const oneSignalRestKey = Deno.env.get("ONESIGNAL_REST_API_KEY")!;

    if (!oneSignalAppId || !oneSignalRestKey) {
      throw new Error("OneSignal credentials not configured");
    }

    // Build OneSignal payload
    const payload: any = {
      app_id: oneSignalAppId,
      headings: { en: title },
      contents: { en: message },
      icon: icon || undefined,
      url: link || undefined,
      // Custom notification sound based on target
      android_sound: targetRole === 'admin' ? 'admin_notification' : 'customer_notification',
      ios_sound: targetRole === 'admin' ? 'admin_notification.mp3' : 'customer_notification.mp3',
      // Data for deep linking
      data: {
        type,
        link,
      },
    };

    // Target specific user by external_user_id
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
      console.error('[OneSignal Edge Function] Error:', data);
      throw new Error(data.errors?.[0]?.message || 'OneSignal API error');
    }

    console.log('[OneSignal Edge Function] Success:', {
      notificationId: data.id,
      recipients: targetUserId ? 1 : 'all',
      type,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      notificationId: data.id,
      recipients: targetUserId ? 1 : 'all',
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('[OneSignal Edge Function] Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});