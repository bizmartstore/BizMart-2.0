import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-force-rotate",
};

// Flash sale lasts 2 hours
const FLASH_SALE_DURATION_MS = 2 * 60 * 60 * 1000;
const MIN_DISCOUNT = 5;
const MAX_DISCOUNT = 10;
const MIN_PRICE_FOR_FLASH_SALE = 30.0;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = Date.now();
    // ✅ Read force flag from headers
    const isForced = req.headers.get("x-force-rotate") === "true";

    if (!isForced) {
      const { data: setting } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "flash_sale_state")
        .maybeSingle();

      if (setting?.value?.ends_at) {
        const endsAt = new Date(setting.value.ends_at).getTime();
        if (endsAt > now) {
          return new Response(
            JSON.stringify({ rotated: false, message: "Flash sale still active" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 2️⃣ RESET ALL PRODUCTS (Crucial: Restore prices from original_price)
    const { data: currentFlash } = await supabase
      .from("products")
      .select("id, original_price, price")
      .eq("is_flash_sale", true);

    if (currentFlash && currentFlash.length > 0) {
      for (const p of currentFlash) {
        const basePrice = p.original_price || p.price;
        await supabase.from("products").update({
          is_flash_sale: false,
          discount_percent: 0,
          sale_price: null,
          original_price: null,
          price: basePrice
        }).eq("id", p.id);
      }
    }

    // 3️⃣ Get eligible candidates
    const { data: allProducts } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .gte("price", MIN_PRICE_FOR_FLASH_SALE);

    if (!allProducts || allProducts.length === 0) {
      return new Response(
        JSON.stringify({ rotated: false, message: "No eligible products" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4️⃣ Pick random products and apply 5-10% discount
    const selected = allProducts.sort(() => Math.random() - 0.5).slice(0, 4);
    const results = [];

    for (const product of selected) {
      const basePrice = Number(product.price);
      const discountPercent = Math.floor(Math.random() * (MAX_DISCOUNT - MIN_DISCOUNT + 1)) + MIN_DISCOUNT;
      const salePrice = Number((basePrice * (1 - discountPercent / 100)).toFixed(2));

      await supabase.from("products").update({
        is_flash_sale: true,
        discount_percent: discountPercent,
        sale_price: salePrice,
        original_price: basePrice,
      }).eq("id", product.id);

      results.push({ id: product.id, name: product.name, discount: discountPercent });
    }

    // 5️⃣ Update timer
    const endsAt = new Date(now + FLASH_SALE_DURATION_MS).toISOString();
    await supabase.from("app_settings").upsert({
      key: "flash_sale_state",
      value: { ends_at: endsAt, product_ids: selected.map(p => p.id) },
      updated_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ rotated: true, ends_at: endsAt, count: results.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});