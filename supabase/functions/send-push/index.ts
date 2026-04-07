import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tokens, title, body, type } = await req.json();
    
    // Firebase Cloud Messaging V1 API endpoint
    const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/bizmart-aaf1b/messages:send`;
    const VAPID_KEY = Deno.env.get("FIREBASE_VAPID_KEY")!;
    
    const responses = await Promise.allSettled(
      tokens.map(async (token: string) => {
        const message = {
          message: {
            token,
            notification: {
              title,
              body,
              sound: "customer-notification.mp3",
            },
            data: {
              type,
              click_action: "https://bizmart-app.vercel.app",
            },
          },
        };
        
        const response = await fetch(FCM_ENDPOINT, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${VAPID_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });
        
        return { token, response };
      })
    );
    
    // Log any failures
    responses.forEach((result, idx) => {
      if (result.status === "rejected") {
        console.error(`FCM send failed for token ${tokens[idx]}:`, result.reason);
      }
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});