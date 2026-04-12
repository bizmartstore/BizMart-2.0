import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FLASH_SALE_DURATION_MS = 2 * 60 * 60 * 1000;
const MIN_DISCOUNT = 5;
const MAX_DISCOUNT = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: setting } = await supabase
      .from("app_settings")
      .select("*")
      .eq("key", "flash_sale_state")
      .maybeSingle();

    const now = Date.now();
    if (setting?.value?.ends_at) {
      const endsAt = new Date(setting.value.ends_at).getTime();
      if (endsAt > now) {
        return new Response(
          JSON.stringify({
            rotated: false,
            message: "Flash sale still active",
            ends_at: setting.value.ends_at,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { data: allProducts } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    // Reset all products first
    await supabase.from("products").update({ isflashsale: false }).eq("is_active", true);

    if (!allProducts || allProducts.length === 0) {
      return new Response(
        JSON.stringify({ rotated: false, message: "No products available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const shuffled = allProducts.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(4, shuffled.length));

    for (const product of selected) {
      const basePrice = product.original_price ? Number(product.original_price) : Number(product.price);
      const discount = Math.floor(Math.random() * (MAX_DISCOUNT - MIN_DISCOUNT + 1)) + MIN_DISCOUNT;
      const salePrice = Number((basePrice * (1 - discount / 100)).toFixed(2));

      await supabase.from("products").update({
        price: salePrice,
        isflashsale: true, // Corrected column name
        original_price: basePrice,
      }).eq("id", product.id);
    }

    const endsAt = new Date(now + FLASH_SALE_DURATION_MS).toISOString();
    const val = { ends_at: endsAt, product_ids: selected.map((p) => p.id) };
    
    if (setting) {
      await supabase.from("app_settings").update({ value: val, updated_at: new Date().toISOString() }).eq("key", "flash_sale_state");
    } else {
      await supabase.from("app_settings").insert({ key: "flash_sale_state", value: val });
    }

    return new Response(
      JSON.stringify({ rotated: true, ends_at: endsAt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as any).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});