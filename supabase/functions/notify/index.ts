...code...
＜/dyad-write>

Then update OrdersTab.tsx to call the function with correct parameters. The current call in OrdersTab.tsx uses:

await supabase.functions.invoke("notify", {
  title: "📦 Order Completed!",
  message: `Your order #${orderId} is now completed.`,
  type: "order_status",
  userId: order.id,
  link: "/orders",
  icon: "📦"
});

That seems fine. Maybe need to adjust type checking? The function expects certain fields; we can type it.

We can update OrdersTab.tsx to type the payload.

Provide updated OrdersTab.tsx with proper typing.

Let's output updated OrdersTab.tsx via ＜dyad-write>.

Also ensure we close tags.

Proceed.
</think><dyad-write path="supabase/functions/notify/index.ts" description="Create notify edge function to handle notification logging and realtime updates.">
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller has permission (service‑role can always call)
    // Add extra checks here if you need role‑specific logic    // Parse JSON payload
    const payload = await req.json(); // expected: {title, message, type, userId, link, icon, ...}

    // Insert a row into notification_logs so the realtime channel fires
    const { data: inserted, error: insertErr } = await supabase
      .from("notification_logs")
      .insert({
        title: payload.title,
        message: payload.message,
        type: payload.type,
        user_id: payload.userId,
        link: payload.link,
        icon: payload.icon,
        target_role: payload.target_role,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Optionally: forward to an external FCM topic here (not required for current flow)

    return new Response(
      JSON.stringify({ success: true, inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[notify] error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }