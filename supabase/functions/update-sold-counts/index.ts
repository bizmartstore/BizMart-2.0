import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Use anon key instead of service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!  // Use anon key instead of service role key
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("[update-sold-counts] Starting sold count update...")

    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')

    if (productsError) {
      console.error("[update-sold-counts] Error fetching products:", productsError)
      throw productsError
    }

    console.log(`[update-sold-counts] Found ${products.length} products to update`)

    // Update sold count for each product
    for (const product of products) {
      try {
        const { data: orderItems, error: orderError } = await supabase
          .from('orders')
          .select('items')
          .eq('status', 'completed')

        if (orderError) {
          console.error(`[update-sold-counts] Error fetching orders for product ${product.id}:`, orderError)
          continue
        }

        let totalSold = 0

        if (orderItems && orderItems.length > 0) {
          orderItems.forEach((order: any) => {
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item: any) => {
                if (item.id === product.id) {
                  totalSold += item.quantity || 1
                }
              })
            }
          })
        }

        // Update the product with the new sold count
        const { error: updateError } = await supabase
          .from('products')
          .update({ sold: totalSold })
          .eq('id', product.id)

        if (updateError) {
          console.error(`[update-sold-counts] Error updating product ${product.id}:`, updateError)
        } else {
          console.log(`[update-sold-counts] Updated product ${product.id}: sold=${totalSold}`)
        }
      } catch (productError) {
        console.error(`[update-sold-counts] Error processing product ${product.id}:`, productError)
      }
    }

    console.log("[update-sold-counts] Sold count update completed successfully")

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated sold counts for ${products.length} products`,
        products_updated: products.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error("[update-sold-counts] Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})