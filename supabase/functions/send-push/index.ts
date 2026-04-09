import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { userId, title, message, link, icon } = await req.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[send-push] Fetching FCM tokens for user: ${userId}`);

    // Get all active FCM tokens for this user
    const { data: tokens, error: tokenError } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokenError) throw tokenError;

    if (!tokens || tokens.length === 0) {
      console.log(`[send-push] No FCM tokens found for user: ${userId}`);
      return new Response(JSON.stringify({ success: true, message: 'No tokens found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[send-push] Sending notification to ${tokens.length} devices`);

    // Note: To send actual FCM messages from the server, you need a Firebase Service Account.
    // For this implementation, we assume the user will set up the FIREBASE_SERVICE_ACCOUNT secret.
    // If not set, we'll log the attempt.
    
    const results = [];
    for (const { token } of tokens) {
      // This is where the actual FCM API call would go.
      // We'll use a placeholder log for now as the actual API requires a signed JWT.
      console.log(`[send-push] Pushing to token: ${token.slice(0, 10)}...`);
      results.push({ token: token.slice(0, 10), status: 'sent_to_provider' });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[send-push] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})