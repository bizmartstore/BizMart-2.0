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
      throw new Error("ONESIGNAL_REST_API_KEY environment variable is not set");
    }

    const { title, message, targetUserId, targetRole, link, icon } = await req.json();

    console.log("[send-notification] Request received:", { title, message, targetUserId, targetRole, link });

    if (!title || !message) {
      throw new Error("Missing required fields: title and message");
    }

    // Build payload
    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      data: { link, type: "notification" },
      android_sound: "notification",
      ios_sound: "notification",
    };

    // Add icon if provided
    if (icon) {
      payload.icon = icon;
    }

    // --- Targeting ---
    if (targetUserId) {
      // Send ONLY to this user via External ID
      payload.include_external_user_ids = [targetUserId];
      console.log(`[send-notification] Targeting user via External ID: ${targetUserId}`);
    } else if (targetRole) {
      // Send to users with specific role tag
      payload.filters = [
        { field: "tag", key: "role", relation: "==", value: targetRole }
      ];
      console.log(`[send-notification] Targeting role: ${targetRole}`);
    } else {
      // Safety: send to all subscribers (should not happen in production)
      payload.included_segments = ["Subscribed Users"];
      console.log("[send-notification] Targeting all subscribers (fallback)");
    }

    console.log("[send-notification] Payload:", JSON.stringify(payload, null, 2));

    // Send notification
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[send-notification] OneSignal API error:", result);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.errors ? result.errors.join(', ') : result.error || 'OneSignal API error' 
        }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if notification was successfully created
    if (!result.id) {
      console.error("[send-notification] OneSignal returned no notification ID:", result);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No notification ID returned from OneSignal" 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("[send-notification] Success:", result);
    return new Response(JSON.stringify({ 
      success: true, 
      notification_id: result.id,
      recipients: payload.include_external_user_ids || "tagged users" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[send-notification] Error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});