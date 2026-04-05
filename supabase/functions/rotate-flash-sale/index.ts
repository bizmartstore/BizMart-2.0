import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const FLASH_SALE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours per flash sale round

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check current flash sale state
    const { data: setting } = await supabase
      .from("app_settings")
      .select("*")
      .eq("key", "flash_sale_state")
      .maybeSingle();

    const now = Date.now();

    if (setting?.value?.ends_at) {
      const endsAt = new Date(setting.value.ends_at).getTime();
      if (endsAt > now) {
        return new Response(JSON.stringify({ rotated: false, message: "Flash sale still active", ends_at: setting.value.ends_at }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // Get min and max discount percentages from app_settings
    const { data: minDiscountData } = await supabase      .from("app_settings")
      .select("value")
      .eq("key", "flash_sale_min_discount")
      .maybeSingle();    
    const { data: maxDiscountData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "flash_sale_max_discount")
      .maybeSingle();
    const minDiscount = minDiscountData?.value?.percentage ? Number(minDiscountData.value.percentage) : 5;
    const maxDiscount = maxDiscountData?.value?.percentage ? Number(maxDiscountData.value.percentage) : 15;

    // Get all active products
    const { data: allProducts } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (!allProducts || allProducts.length === 0) {
      // Set a future end time even with no products so we don't keep retrying
      const endsAt = new Date(now + FLASH_SALE_DURATION_MS).toISOString();
      const val = { ends_at: endsAt, product_ids: [] };
      if (setting) {
        await supabase.from("app_settings").update({ value: val, updated_at: new Date().toISOString() }).eq("key", "flash_sale_state");
      } else {
        await supabase.from("app_settings").insert({ key: "flash_sale_state", value: val });
      }
      return new Response(JSON.stringify({ rotated: false, message: "No products available", ends_at: endsAt }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Randomly pick up to 6 products for flash sale
    const shuffled = allProducts.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(6, shuffled.length));

    // Apply discount within the allowed range
    for (const product of selected) {      // Ensure product has price and original_price
      const originalPrice = Number(product.price);
      if (originalPrice <= 0) continue;
      
      // Generate random discount between minDiscount and maxDiscount
      const minDiscount = Math.min(maxDiscount, Math.max(minDiscount, 10)); // Ensure at least 10% base discount? Actually use the configured min
      const maxDiscount = maxDiscount; // Use the configured max
      const discountPercent = Math.floor(Math.random() * (maxDiscount - minDiscount + 1)) + minDiscount;      const salePrice = Number((originalPrice * (1 - discountPercent / 100)).toFixed(2));
      await supabase.from("products").update({
        price: salePrice,        is_flash_sale: true,
        original_price: originalPrice,      }).eq("id", product.id);
    }

    // Set new flash sale end time
    const endsAt = new Date(now + FLASH_SALE_DURATION_MS).toISOString();
    const val = { ends_at: endsAt, product_ids: selected.map(p => p.id) };

    if (setting) {
      await supabase.from("app_settings").update({
        value: val,
        updated_at: new Date().toISOString(),
      }).eq("key", "flash_sale_state");
    } else {
      await supabase.from("app_settings").insert({ key: "flash_sale_state", value: val });
    }

    return new Response(JSON.stringify({
      rotated: true,
      products: selected.map(p => p.name),
      ends_at: endsAt,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});