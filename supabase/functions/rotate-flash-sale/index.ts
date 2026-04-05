import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../constants.ts";

const FLASH_SALE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours per flash‑sale round

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { fetch } }
    );

    // ---- 1️⃣  Read the min / max discount values from app_settings ----
    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "flash_sale_min_discount")
      .maybeSingle();
    const minDiscount = settings?.value?.min ?? 2; // default 2 %
    const { data: settingsMax, error: settingsMaxError } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "flash_sale_max_discount")
      .maybeSingle();
    const maxDiscount = settingsMax?.value?.max ?? 15; // default 15 %

    if (settingsError || settingsMaxError) {
      throw new Error("Failed to read flash‑sale bounds from app_settings");
    }

    // ---- 2️⃣  Determine which products are eligible for flash‑sale ----
    const { data: allProducts, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (productsError) throw productsError;
    if (!allProducts?.length) {
      // No products – just store a placeholder so we don’t keep retrying
      const placeholder = { ends_at: new Date(Date.now() + FLASH_SALE_DURATION_MS).toISOString() };
      await supabase
        .from("app_settings")
        .update({ value: { ends_at: placeholder.ends_at, product_ids: [] } })
        .eq("key", "flash_sale_state");
      return new Response(JSON.stringify({ rotated: false, message: "No products available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      };
    }

    // ---- 3️⃣  Pick up to 6 products at random ----
    const shuffled = allProducts.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(6, shuffled.length));

    // ---- 4️⃣  Apply a random discount between minDiscount and maxDiscount ----
    const applyDiscount = (product: any) => {
      const discountPct = Math.floor(
        Math.random() * (maxDiscount - minDiscount + 1)
      ) + minDiscount;
      const originalPrice = Number(product.price);
      const salePrice = Number((originalPrice * (1 - discountPct / 100)).toFixed(2));
      return {
        ...product,
        is_flash_sale: true,
        original_price: originalPrice,
        price: salePrice,
      };
    };

    for (const product of selected) {
      await supabase
        .from("products")
        .update({
          is_flash_sale: true,
          original_price: product.price,
          price: product.price * (1 - (Math.floor(Math.random() * (maxDiscount - minDiscount + 1)) + minDiscount) / 100),
        })
        .eq("id", product.id);
    }

    // ---- 5️⃣  Store the new end‑time and the IDs of the products on sale ----
    const endsAt = new Date(Date.now() + FLASH_SALE_DURATION_MS).toISOString();
    const productIds = selected.map((p: any) => p.id);

    await supabase
      .from("app_settings")
      .upsert({
        key: "flash_sale_state",
        value: { ends_at: endsAt, product_ids: productIds },
      });

    return new Response(
      JSON.stringify({
        rotated: true,
        products: selected.map((p: any) => p.name),
        ends_at: endsAt,
        min_discount: minDiscount,
        max_discount: maxDiscount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }