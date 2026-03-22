import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ONESIGNAL_APP_ID = "56883e62-5aae-4486-b9c3-84e5e1db41c9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (!ONESIGNAL_REST_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing ONESIGNAL_REST_API_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { title, message, targetRole, targetUserId } = body;

    const isAdmin = targetRole === "admin";

    // Safety: Ensure external_user_id is provided for single-user notification
    if (!isAdmin && targetUserId?.trim() === "") {
      return new Response(
        JSON.stringify({ error: "targetUserId is required for customer notifications" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build payload
    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title || (isAdmin ? "Admin Notification" : "Customer Notification") },
      contents: { en: message || "You have a new notification" },
      android_sound: isAdmin ? "admin_notification" : "customer_notification",
      ios_sound: isAdmin ? "admin_notification" : "customer_notification", // Removed .mp3 extension for iOS
      android_channel_id: "bizmart-notifications",
    };

    // --- Targeting ---
    if (targetUserId) {
      // Send ONLY to this user
      payload.include_external_user_ids = [targetUserId];
      console.log(`[send-notification] Sending to user: ${targetUserId}`);
    } else if (isAdmin) {
      // Send to all admins via role tags
      payload.filters = [
        { field: "tag", key: "role", relation: "=", value: "main_admin" },
        { operator: "OR" },
        { field: "tag", key: "role", relation: "=", value: "member_admin" },
      ];
      console.log("[send-notification] Sending to admins via tags");
    } else {
      // Safety fallback: send to all subscribers (optional)
      payload.included_segments = ["Subscribed Users"];
      console.log("[send-notification] Sending to all subscribers");
    }

    console.log("[send-notification] Payload:", JSON.stringify(payload, null, 2));

    // Send notification
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Check for OneSignal errors: if no id, then error
    if (!data.id) {
      const errorMsg = data.errors ? data.errors.join(', ') : 'OneSignal returned no notification ID';
      console.error("[send-notification] OneSignal error:", errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("[send-notification] OneSignal success:", data);
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