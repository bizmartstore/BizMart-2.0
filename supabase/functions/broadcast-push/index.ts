import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import * as jose from 'https://esm.sh/jose@5.2.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Manual JWT verification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', {
        status: 401,
        headers: corsHeaders
      })
    }

    // Use anon key for database operations
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

    const { title, message, link, icon } = await req.json()

    if (!title || !message) {
      return new Response(JSON.stringify({ error: 'Title and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get Firebase service account from secrets
    const serviceAccountRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    
    if (!serviceAccountRaw) {
      console.error("[broadcast-push] Missing FIREBASE_SERVICE_ACCOUNT secret");
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

    // Get all users who have FCM tokens
    const { data: usersWithTokens, error: usersError } = await supabase
      .from('fcm_tokens')
      .select('user_id')

    if (usersError) {
      console.error("[broadcast-push] Error fetching users:", usersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get unique user IDs
    const userIds = [...new Set(usersWithTokens.map(u => u.user_id))]
    
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No users with FCM tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[broadcast-push] Sending broadcast to ${userIds.length} users`)

    // Send push notifications to all users
    const results = []
    
    for (const userId of userIds) {
      try {
        // Get FCM tokens for this user
        const { data: tokens, error: tokenError } = await supabase
          .from('fcm_tokens')
          .select('token')
          .eq('user_id', userId)

        if (tokenError || !tokens || tokens.length === 0) {
          console.warn(`[broadcast-push] No tokens for user ${userId}`)
          continue
        }

        // Send to each token
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
            results.push({ userId: userId.slice(0, 8), token: token.slice(0, 10), status: fcmRes.ok ? 'success' : 'error', details: resData })
          } catch (err) {
            results.push({ userId: userId.slice(0, 8), token: token.slice(0, 10), status: 'failed', error: err.message })
          }
        }
      } catch (userError) {
        console.error(`[broadcast-push] Error for user ${userId}:", userError`)
        results.push({ userId: userId.slice(0, 8), status: 'failed', error: userError.message })
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      totalUsers: userIds.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error(`[broadcast-push] Error:`, error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
