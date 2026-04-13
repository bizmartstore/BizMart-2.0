import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[scheduled-flash-sale-rotation] Starting scheduled flash sale rotation...");

    // Call the rotate-flash-sale edge function
    const rotateResponse = await fetch(
      "https://zvtwkhlmexvkefgwvfdp.supabase.co/functions/v1/rotate-flash-sale",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "x-force-rotate": "true"
        },
        body: JSON.stringify({ scheduled: true })
      }
    );

    const result = await rotateResponse.json();
    console.log("[scheduled-flash-sale-rotation] Rotation result:", result);

    // Also refresh the hottest sale products
    const { error: refreshError } = await supabase
      .rpc("refresh_hottest_sale_products");

    if (refreshError) {
      console.error("[scheduled-flash-sale-rotation] Error refreshing hottest sale products:", refreshError);
    } else {
      console.log("[scheduled-flash-sale-rotation] Hottest sale products refreshed successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        rotated: result.rotated,
        ends_at: result.ends_at,
        count: result.count
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[scheduled-flash-sale-rotation] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
