import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FLASH_SALE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours per flash sale round
const MIN_DISCOUNT = 5;
const MAX_DISCOUNT = 15;

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
        return new Response(JSON.stringify({ 
          rotated: false, 
          message: "Flash sale still active", 
          ends_at: setting.value.ends_at 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get min and max discount percentages from app_settings with safe parsing
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

    // Enforce hard limits 5-15% regardless of config
    const configMin = Math.max(MIN_DISCOUNT, Math.min(MAX_DISCOUNT, rawMin));
    const configMax = Math.min(MAX_DISCOUNT, Math.max(MIN_DISCOUNT, rawMax));

    // Get all active products
    const { data: allProducts } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (!allProducts || allProducts.length === 0) {
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

    // Apply biased discount: 75% chance for 5-10%, 25% chance for 11-15%
    const appliedDiscounts: Array<{name: string, discount: number, basePrice: number, salePrice: number}> = [];

    for (const product of selected) {
      // Always calculate discount from the original price to avoid compounding discounts
      const basePrice = product.original_price ? Number(product.original_price) : Number(product.price);
      if (basePrice <= 0) continue;
      
      let discountPercent;
      const roll = Math.random();
      
      // Determine effective ranges
      const lowerMax = Math.min(10, configMax);
      const upperMin = Math.max(11, configMin);
      
      // Decide range based on config and bias
      if (configMax <= 10) {
        // Config only allows 5-10
        discountPercent = Math.floor(Math.random() * (configMax - configMin + 1)) + configMin;
      } else if (configMin >= 11) {
        // Config only allows 11-15
        discountPercent = Math.floor(Math.random() * (configMax - configMin + 1)) + configMin;
      } else {
        // Config spans both ranges: apply 75/25 bias
        if (roll < 0.75) {
          // Lower range (5-10%)
          discountPercent = Math.floor(Math.random() * (lowerMax - configMin + 1)) + configMin;
        } else {
          // Upper range (11-15%)
          discountPercent = Math.floor(Math.random() * (configMax - upperMin + 1)) + upperMin;
        }
      }
      
      // FINAL SAFETY CLAMP: Ensure discount is ALWAYS between 5-15%
      discountPercent = Math.max(MIN_DISCOUNT, Math.min(MAX_DISCOUNT, discountPercent));

      const salePrice = Number((basePrice * (1 - discountPercent / 100)).toFixed(2));

      appliedDiscounts.push({
        name: product.name,
        discount: discountPercent,
        basePrice,
        salePrice,
      });

      await supabase.from("products").update({
        price: salePrice,
        is_flash_sale: true,
        original_price: basePrice,
      }).eq("id", product.id);
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
      debug_discounts: appliedDiscounts, // For debugging only
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