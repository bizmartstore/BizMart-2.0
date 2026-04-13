import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { verifyAuth, logExecution, createResponse } from "../_shared/scheduler.ts"

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    }})
  }

  const functionName = "refresh-hottest-sale"

  try {
    // Verify authentication
    const authResult = await verifyAuth(req)
    if (!authResult.valid) {
      logExecution(functionName, "Authentication failed")
      return createResponse({ error: authResult.error || 'Unauthorized' }, 401)
    }

    logExecution(functionName, "Starting hottest sale refresh...")

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? "https://zvtwkhlmexvkefgwvfdp.supabase.co"
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Call the database function to refresh hottest sale products
    const { error } = await supabase.rpc('refresh_hottest_sale_products')

    if (error) {
      logExecution(functionName, "Error refreshing hottest sale products", { error: error.message })
      return createResponse({ error: error.message }, 500)
    }

    logExecution(functionName, "Successfully refreshed hottest sale products")

    return createResponse({
      success: true,
      message: "Hottest sale products refreshed successfully",
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    logExecution(functionName, "Unexpected error", { error: err })
    return createResponse({ error: 'Internal server error' }, 500)
  }
})
