import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import * as jose from 'https://esm.sh/jose@5.2.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    // Manual JWT verification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', {
        status: 401,
        headers: corsHeaders
      })
    }

    // Use anon key instead of service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!  // Use anon key instead of service role key
    )

    const token = authHeader.replace('Bearer ', '')
    
    // Verify JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response('Invalid token', {
        status: 401,
        headers: corsHeaders
      })
    }

    // Check if user is admin
    const { data: roleRecord, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleError || !roleRecord || roleRecord.role !== 'main_admin') {
      return new Response('Forbidden - Admin access required', {
        status: 403,
        headers: corsHeaders
      })
    }

    const { userId, title, message, link, icon } = await req.json()

    if (!userId || !title || !message) {
      return new Response(JSON.stringify({ error: 'userId, title, and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get Firebase service account from secrets
    const serviceAccountRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    
    if (!serviceAccountRaw) {
      console.error("[send-push] Missing FIREBASE_SERVICE_ACCOUNT secret");
      return new Response(JSON.stringify({ error: 'Server configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const serviceAccount = JSON.parse(serviceAccountRaw)
    
    // Get Firebase access token
    const jwt = await new jose.SignJWT({
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setIssuer(serviceAccount.client_email)
      .setAudience('https://oauth2.googleapis.com/token')
      .setExpirationTime('1h')
      .sign(await jose.importPKCS8(serviceAccount.private_key, 'RS256'))

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })

    const data = await res.json()
    const accessToken = data.access_token

    // Get user FCM tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId)

    if (tokenError || !tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results = []

    for (const { token } of tokens) {
      try {
        const fcmRes = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body: message },
              data: { link: link || '/', icon: icon || '' },
              webpush: {
                fcm_options: { link: link || '/' }
              }
            }
          })
        })
        const resData = await fcmRes.json()
        results.push({ token: token.slice(0, 10), status: fcmRes.ok ? 'success' : 'error', details: resData })
      } catch (err) {
        results.push({ token: token.slice(0, 10), status: 'failed', error: err.message })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error(`[send-push] Error:`, error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})
