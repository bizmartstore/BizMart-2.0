const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ONESIGNAL_APP_ID = "617c000e-3cf8-4077-b083-9b4fea4018de";
const ONESIGNAL_REST_API_KEY = "os_v2_app_mf6aadr47bahpmedtnh6uqay3ziy7ejsjkhuoqvfptmr5jpl7gn7tcpggghrajuavbspczopmapnzfi2akauan6dj55pkrd7357ktwi";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, message, targetRole, targetUserId } = await req.json();
    console.log(`[send-notification] Sending: "${title}" to ${targetUserId || targetRole || 'all'}`);

    const isAdminTarget = targetRole === "admin";

    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      // Different sounds for admin vs customer
      android_sound: isAdminTarget ? "admin_notification" : "customer_notification",
      ios_sound: isAdminTarget ? "admin_notification.mp3" : "customer_notification.mp3",
    };

    if (targetUserId) {
      // Send to a specific user (customer or admin)
      payload.include_external_user_ids = [targetUserId];
    } else if (targetRole === "admin") {
      // Send to all admins using tags
      payload.filters = [
        { field: "tag", key: "role", relation: "=", value: "main_admin" },
        { operator: "OR" },
        { field: "tag", key: "role", relation: "=", value: "member_admin" },
      ];
    } else {
      // Send to all subscribed customers (broadcast)
      payload.included_segments = ["Subscribed Users"];
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("[send-notification] OneSignal response:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-notification] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});