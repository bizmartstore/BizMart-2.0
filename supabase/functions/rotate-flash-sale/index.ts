import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Flash sale lasts 2 hours
const FLASH_SALE_DURATION_MS = 2 * 60 * 60 * 1000;

// Hard limits for discount percentages (Strict 5-10% range)
const MIN_DISCOUNT = 5;
const MAX_DISCOUNT = 10;

// Minimum price for flash sale eligibility
const MIN_PRICE_FOR_FLASH_SALE = 30.0;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1️⃣ Check active flash sale
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
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 2️⃣ Reset previous flash sale
    await supabase
      .from("products")
      .update({
        is_flash_sale: false,
        discount_percent: 0,
        sale_price: null,
        original_price: null,
      })
      .eq("is_flash_sale", true);

    // 3️⃣ Get eligible products ONLY (price >= 30)
    const { data: allProducts } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .gte("price", MIN_PRICE_FOR_FLASH_SALE);

    if (!allProducts || allProducts.length === 0) {
      const endsAt = new Date(now + FLASH_SALE_DURATION_MS).toISOString();
      await supabase.from("app_settings").upsert({
        key: "flash_sale_state",
        value: { ends_at: endsAt, product_ids: [] },
        updated_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          rotated: false,
          message: "No eligible products (>= 30)",
          ends_at: endsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4️⃣ Pick exactly 4 random products
    const shuffled = allProducts.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(4, shuffled.length));

    // 5️⃣ Apply random 5-10% discount
    const appliedDiscounts = [];

    for (const product of selected) {
      const basePrice = Number(product.price);
      // Generate random integer between 5 and 10
      const discountPercent = Math.floor(Math.random() * (MAX_DISCOUNT - MIN_DISCOUNT + 1)) + MIN_DISCOUNT;
      const salePrice = Number((basePrice * (1 - discountPercent / 100)).toFixed(2));

      appliedDiscounts.push({
        id: product.id,
        name: product.name,
        basePrice,
        discount: discountPercent,
        salePrice,
      });

      await supabase.from("products").update({
        is_flash_sale: true,
        discount_percent: discountPercent,
        sale_price: salePrice,
        original_price: basePrice,
      }).eq("id", product.id);
    }

    // 6️⃣ Save flash sale state
    const endsAt = new Date(now + FLASH_SALE_DURATION_MS).toISOString();
    await supabase.from("app_settings").upsert({
      key: "flash_sale_state",
      value: { ends_at: endsAt, product_ids: selected.map((p) => p.id) },
      updated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        rotated: true,
        ends_at: endsAt,
        products: appliedDiscounts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});