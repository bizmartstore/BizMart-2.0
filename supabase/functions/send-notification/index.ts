import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, message, targetUserId, targetRole, link } = await req.json();

    if (!title || !message) {
      throw new Error("Missing title or message");
    }

    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      url: link,
      data: { link },
    };

    // Targeting Logic
    if (targetUserId) {
      // Target specific user by their Supabase ID
      payload.include_external_user_ids = [targetUserId];
    } else if (targetRole === "admin") {
      // Target users tagged as admins
      payload.filters = [
        { field: "tag", key: "role", relation: "regex", value: "admin" }
      ];
    } else {
      // Broadcast to all
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

    const result = await response.json();
    
    if (!response.ok) {
      console.error("[OneSignal Error]", result);
      return new Response(JSON.stringify(result), { status: response.status, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});