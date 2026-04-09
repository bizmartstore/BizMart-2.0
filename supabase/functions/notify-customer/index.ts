import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VAPID_KEY = "YOUR_VAPID_PUBLIC_KEY"; // <-- replace with your VAPID public key

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // -----------------------------------------------------------------    // 1️⃣  Verify the caller is authorized (only admin functions may call)
    // -----------------------------------------------------------------
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify that the caller is an admin (you can tighten this check)
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: user } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---------------------------------------------------------------
    // 2️⃣  Parse the payload
    // ---------------------------------------------------------------
    const body = await req.json();
    const {
      title,
      message,
      type,
      userId,
      link,
      icon,
      targetRole,
    } = body;

    // ---------------------------------------------------------------
    // 3️⃣  Look up the user’s push‑token(s)
    // ---------------------------------------------------------------
    const { data: tokenRow, error: tokenError } = await supabase
      .from("fcm_tokens")
      .select("token")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenRow) {
      // No token stored – nothing to push      return new Response(
        JSON.stringify({ error: "No push token for this user" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    // ---------------------------------------------------------------
    // 4️⃣  Send the push notification
    // ---------------------------------------------------------------
    const payload = JSON.stringify({
      title,
      body: message,
      icon,
      data: { type, link, targetRole },
    });

    const endpoint = tokenRow.token; // the VAP‑Web endpoint
    const auth = urlencode(
      base64Encode(base64Decode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!))
    );

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `WebPush ${auth}`,
      },
      body: payload,
    });

    if (!response.ok) throw new Error("Push send failed");

    return new Response(
      JSON.stringify({ success: true, sentTo: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Push‑send error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

/* Helper – base64 encode / decode (Deno has built‑in) */
function base64Encode(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf));
}
function base64Decode(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}