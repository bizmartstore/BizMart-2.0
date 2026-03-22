import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") || "";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, message, targetUserId, targetRole, link, icon = "🔔" } = await req.json();

    if (!title || !message) {
      throw new Error("Missing required fields: title and message");
    }

    // 1️⃣ Log to DB (best‑effort, don’t block the flow)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const client = new supabase.createClient(supabaseUrl, supabaseKey);

      await client.from("notification_logs").insert({
        user_id: targetUserId || null,
        target_role: targetRole || null,
        title,
        message,
        type: "system",
        link,
        icon,
      });
    } catch (dbError) {
      console.error("[Notification] DB log failed:", dbError);
      // continue even if DB logging fails    }

    // 2️⃣ Prepare OneSignal payload
    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      data: { link, type: "notification", timestamp: new Date().toISOString() },
      // Android/iOS specific options
      android_channel_id: "bizmart-notifications",
      android_priority: 10,
      ios_sound: "default",
      ios_badge_type: "Increase",
      ios_badge_count: 1,
    };

    // 3️⃣ Targeting logic
    if (targetUserId) {
      payload.include_external_user_ids = [targetUserId];
    } else if (targetRole) {
      payload.filters = [{ field: "tag", key: "role", relation: "==", value: targetRole }];
    } else {
      payload.included_segments = ["Subscribed Users"];
    }

    // 4️⃣ Build the Authorization header correctly (Basic auth with API key as username)
    const authHeader = `Basic ${btoa(`${ONESIGNAL_REST_API_KEY}:`)}`;

    // 5️⃣ Send to OneSignal
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[OneSignal Error]", result);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.errors || result.message || "OneSignal API error",
          details: result,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
        recipients: targetUserId ? 1 : "all",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Send Notification] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});