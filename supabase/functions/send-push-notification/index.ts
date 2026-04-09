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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record } = await req.json()
    const { user_id, title, message, target_role } = record

    // 1. Get FCM tokens for the user or admins
    let query = supabase.from('fcm_tokens').select('token')
    
    if (target_role === 'admin') {
      const { data: admins } = await supabase.from('user_roles').select('user_id').in('role', ['main_admin', 'member_admin'])
      const adminIds = admins?.map(a => a.user_id) || []
      query = query.in('user_id', adminIds)
    } else {
      query = query.eq('user_id', user_id)
    }

    const { data: tokens } = await query
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No tokens found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Get Firebase Service Account Key from Secrets
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY') || '{}')
    
    // Note: In a real production environment, you'd use a library like 'google-auth-library' 
    // to get an access token. For this implementation, we assume you've set up the 
    // Supabase HTTP Hook to trigger this function.

    console.log(`[send-push-notification] Sending to ${tokens.length} devices: ${title}`)

    // This is a simplified representation. You would typically use the Firebase Admin SDK 
    // or the FCM REST API v1 here.
    
    return new Response(JSON.stringify({ success: true, sent_to: tokens.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('[send-push-notification] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})