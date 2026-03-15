const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ONESIGNAL_APP_ID = "56883e62-5aae-4486-b9c3-84e5e1db41c9";
// Use environment variable if available, otherwise use the provided key
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") || "os_v2_app_k2ed4ys2vzcinoodqts6dw2bzfrbtebv66aeobnecldt2hztvis4nzzor4vpyqiadtuoa4oknt4s5anypm5yv3ht33sss7khnezbeaa";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[send-notification] Using OneSignal App ID:", ONESIGNAL_APP_ID);

    const { title, message, targetRole, targetUserId } = await req.json();
    console.log("[send-notification] Received:", JSON.stringify({ title, targetRole, targetUserId }));

    // Build OneSignal payload
    const isAdminTarget = targetRole === "admin";
    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      // Custom notification sound
      android_sound: isAdminTarget ? "admin_notification" : "customer_notification",
      ios_sound: isAdminTarget ? "admin_notification.mp3" : "customer_notification.mp3",
    };

    if (targetUserId) {
      // Send to specific user by external_user_id
      payload.include_aliases = { external_id: [targetUserId] };
      payload.target_channel = "push";
    } else if (targetRole === "admin") {
      // Send to admins using tags
      payload.filters = [
        { field: "tag", key: "role", relation: "=", value: "main_admin" },
        { operator: "OR" },
        { field: "tag", key: "role", relation: "=", value: "member_admin" },
      ];
    } else {
      // Send to all subscribers
      payload.included_segments = ["Subscribed Users"];
    }

    console.log("[send-notification] OneSignal payload:", JSON.stringify(payload));

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("[send-notification] OneSignal response:", JSON.stringify(data));

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-notification] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});