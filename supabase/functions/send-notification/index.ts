import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") || "";
const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") || "";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") || "";

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN not configured");
}
if (!TELEGRAM_CHAT_ID) {
  throw new Error("TELEGRAM_CHAT_ID not configured");
}
if (!ONESIGNAL_APP_ID) {
  throw new Error("ONESIGNAL_APP_ID not configured");
}
if (!ONESIGNAL_REST_API_KEY) {
  throw new Error("ONESIGNAL_REST_API_KEY not configured");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, message, type, userId, targetRole, link, icon = "🔔" } = await req.json();

    // Validate required fields
    if (!title || !message) {
      throw new Error("Missing title or message");
    }

    // Build payload for OneSignal    const oneSignalPayload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      data: { type, link, icon },
    };

    // Targeting Logic
    if (userId) {
      // Target specific user by their Supabase ID
      oneSignalPayload.include_external_user_ids = [userId];
    } else if (targetRole === "admin") {
      // Target users tagged as admins
      oneSignalPayload.filters = [
        { field: "tag", key: "role", relation: "regex", value: "admin" }
      ];
    } else {
      // Broadcast to all
      oneSignalPayload.included_segments = ["Subscribed Users"];
    }

    // Send to OneSignal
    const oneSignalResponse = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(oneSignalPayload),
    });

    const oneSignalResult = await oneSignalResponse.json();
    console.log("[OneSignal] Response:", oneSignalResult);

    // Also send to Telegram
    const tgPayload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: `🚨 ${type.toUpperCase()} Notification\n${title}\n${message}`,
      parse_mode: "HTML",
    };

    const tgResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tgPayload),
    });

    const tgResult = await tgResponse.json();
    console.log("[Telegram] Response:", tgResult);

    return new Response(JSON.stringify({ success: true, oneSignalResult, tgResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[Notification Function] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});