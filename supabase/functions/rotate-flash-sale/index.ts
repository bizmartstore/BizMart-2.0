import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Flash sale lasts 2 hours
const FLASH_SALE_DURATION_MS = 2 * 60 * 60 * 1000;
// Hard limits for discount percentages
const MIN_DISCOUNT = 5;
const MAX_DISCOUNT = 10; // reduced from 15 to 10

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ---------------------------------------------------
    // 1️⃣  Check if a flash sale is already active
    // ---------------------------------------------------
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

    // ---------------------------------------------------
    // 2️⃣  Load discount configuration (fallback to hard limits)
    // ---------------------------------------------------
    const safeParse = (data: any, fallback: number): number => {
      if (!data?.value?.percentage) return fallback;
      const val = Number(data.value.percentage);
      return isNaN(val) ? fallback : val;
    };

    const { data: minDiscountData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "flash_sale_min_discount")
      .maybeSingle();
    const { data: maxDiscountData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "flash_sale_max_discount")
      .maybeSingle();

    const rawMin = safeParse(minDiscountData, MIN_DISCOUNT);
    const rawMax = safeParse(maxDiscountData, MAX_DISCOUNT);

    // Enforce hard limits (5‑10%) regardless of what the admin set
    const configMin = Math.max(MIN_DISCOUNT, Math.min(MAX_DISCOUNT, rawMin));
    const configMax = Math.min(MAX_DISCOUNT, Math.max(MIN_DISCOUNT, rawMax));

    // ---------------------------------------------------
    // 3️⃣  Pull all active products
    // ---------------------------------------------------
    const { data: allProducts } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (!allProducts || allProducts.length === 0) {
      const endsAt = new Date(now + FLASH_SALE_DURATION_MS).toISOString();
      const val = { ends_at: endsAt, product_ids: [] };
      if (setting) {
        await supabase
          .from("app_settings")
          .update({ value: val, updated_at: new Date().toISOString() })
          .eq("key", "flash_sale_state");
      } else {
        await supabase.from("app_settings").insert({ key: "flash_sale_state", value: val });
      }
      return new Response(
        JSON.stringify({ rotated: false, message: "No products available", ends_at: endsAt }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---------------------------------------------------
    // 4️⃣  Randomly select up to 4 products for this round
    // ---------------------------------------------------
    const shuffled = allProducts.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(4, shuffled.length));

    // ---------------------------------------------------
    // 5️⃣  Apply a discount between 5%‑10% to each selected product
    // ---------------------------------------------------
    const appliedDiscounts: Array<{ name: string; discount: number; basePrice: number; salePrice: number }> = [];
    for (const product of selected) {
      const basePrice = product.original_price ? Number(product.original_price) : Number(product.price);
      if (basePrice <= 0) continue;

      // Random discount within the allowed range (inclusive)
      const discountPercent = Math.floor(Math.random() * (configMax - configMin + 1)) + configMin;
      // Final safety clamp – guarantees 5‑10%
      const finalDiscount = Math.max(MIN_DISCOUNT, Math.min(MAX_DISCOUNT, discountPercent));

      const salePrice = Number((basePrice * (1 - finalDiscount / 100)).toFixed(2));

      appliedDiscounts.push({
        name: product.name,
        discount: finalDiscount,
        basePrice,
        salePrice,
      });

      await supabase.from("products").update({
        price: salePrice,
        isFlashSale: true,
        original_price: basePrice,
      }).eq("id", product.id);
    }

    // ---------------------------------------------------
    // 6️⃣  Store the new flash‑sale state (end time + product IDs)
    // ---------------------------------------------------
    const endsAt = new Date(now + FLASH_SALE_DURATION_MS).toISOString();
    const val = { ends_at: endsAt, product_ids: selected.map((p) => p.id) };
    if (setting) {
      await supabase
        .from("app_settings")
        .update({ value: val, updated_at: new Date().toISOString() })
        .eq("key", "flash_sale_state");
    } else {
      await supabase.from("app_settings").insert({ key: "flash_sale_state", value: val });
    }

    return new Response(
      JSON.stringify({
        rotated: true,
        products: selected.map((p) => p.name),
        ends_at: endsAt,
        debug_discounts: appliedDiscounts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as any).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
