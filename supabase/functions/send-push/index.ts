import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import * as jose from 'https://esm.sh/jose@5.2.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(serviceAccount: any) {
  const jwt = await new jose.SignJWT({
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setIssuer(serviceAccount.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setExpirationTime('1h')
    .sign(await jose.importPKCS8(serviceAccount.private_key, 'RS256'));

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { userId, title, message, link, icon } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const serviceAccountRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')

    if (!serviceAccountRaw) {
      console.error("[send-push] Missing FIREBASE_SERVICE_ACCOUNT secret");
      return new Response(JSON.stringify({ error: 'Server configuration missing' }), { status: 500, headers: corsHeaders })
    }

    const serviceAccount = JSON.parse(serviceAccountRaw)
    
    // Get user tokens
    const { data: tokens } = await supabase.from('fcm_tokens').select('token').eq('user_id', userId)
    if (!tokens || tokens.length === 0) return new Response(JSON.stringify({ success: true, message: 'No tokens' }), { headers: corsHeaders })

    const accessToken = await getAccessToken(serviceAccount)
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
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})