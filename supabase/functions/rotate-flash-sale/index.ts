import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FLASH_SALE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours per flash sale round

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Restore previous flash sale products to original prices first
    if (setting?.value?.product_ids?.length) {
      for (const pid of setting.value.product_ids) {
        const { data: prod } = await supabase.from("products").select("*").eq("id", pid).maybeSingle();
        if (prod && prod.is_flash_sale && prod.original_price) {
          await supabase.from("products").update({
            price: prod.original_price,
            is_flash_sale: false,
            original_price: null,
          }).eq("id", pid);
        }
      }
    }

    // Also clear any stray flash sale products
    await supabase.from("products").update({ is_flash_sale: false, original_price: null }).eq("is_flash_sale", true);

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

    // Apply 10-20% discount
    for (const product of selected) {
      const discountPercent = Math.floor(Math.random() * 11) + 10;
      const originalPrice = Number(product.price);
      const salePrice = Number((originalPrice * (1 - discountPercent / 100)).toFixed(2));

      await supabase.from("products").update({
        is_flash_sale: true,
        original_price: originalPrice,
        price: salePrice,
      }).eq("id", product.id);
    }

    // Set new flash sale end time
    const endsAt = new Date(now + FLASH_SALE_DURATION_MS).toISOString();
    const val = { ends_at: endsAt, product_ids: selected.map((p: any) => p.id) };

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
      products: selected.map((p: any) => p.name),
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
