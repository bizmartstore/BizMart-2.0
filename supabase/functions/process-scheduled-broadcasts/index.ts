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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    console.log("[process-scheduled-broadcasts] Starting scheduled broadcast processing...")

    // Get all pending scheduled broadcasts that are due
    const now = new Date().toISOString()
    const { data: pendingBroadcasts, error: fetchError } = await supabase
      .from('scheduled_broadcasts')
      .select('*')
      .eq('status', 'pending')
      .lte('schedule_time', now)
      .order('schedule_time', { ascending: true })

    if (fetchError) {
      console.error("[process-scheduled-broadcasts] Error fetching broadcasts:", fetchError)
      throw fetchError
    }

    if (!pendingBroadcasts || pendingBroadcasts.length === 0) {
      console.log("[process-scheduled-broadcasts] No pending broadcasts to process")
      return new Response(
        JSON.stringify({ success: true, message: 'No pending broadcasts', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[process-scheduled-broadcasts] Found ${pendingBroadcasts.length} pending broadcasts`)

    let processedCount = 0

    // Process each broadcast
    for (const broadcast of pendingBroadcasts) {
      try {
        console.log(`[process-scheduled-broadcasts] Processing broadcast: ${broadcast.title}`)

        // Send the broadcast via the broadcast-push function
        const { data, error } = await supabase.functions.invoke("broadcast-push", {
          body: {
            title: broadcast.title,
            message: broadcast.message,
            link: broadcast.link,
            icon: broadcast.icon
          }
        })

        if (error) {
          console.error(`[process-scheduled-broadcasts] Error sending broadcast ${broadcast.id}:`, error)
          throw error
        }

        console.log(`[process-scheduled-broadcasts] Broadcast ${broadcast.id} sent successfully`)

        // Mark as completed
        const { error: updateError } = await supabase
          .from('scheduled_broadcasts')
          .update({ status: 'completed' })
          .eq('id', broadcast.id)

        if (updateError) {
          console.error(`[process-scheduled-broadcasts] Error updating broadcast ${broadcast.id}:`, updateError)
          throw updateError
        }

        processedCount++

        // Save to notification logs for record
        await supabase.from('notification_logs').insert({
          title: broadcast.title,
          message: broadcast.message,
          type: 'broadcast',
          icon: broadcast.icon,
          link: broadcast.link,
          target_role: 'customer',
          created_at: new Date().toISOString()
        })

      } catch (broadcastError) {
        console.error(`[process-scheduled-broadcasts] Failed to process broadcast ${broadcast.id}:`, broadcastError)
        // Mark as failed
        await supabase
          .from('scheduled_broadcasts')
          .update({ status: 'failed' })
          .eq('id', broadcast.id)
      }
    }

    console.log(`[process-scheduled-broadcasts] Successfully processed ${processedCount} broadcasts`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        total: pendingBroadcasts.length,
        message: `Processed ${processedCount} of ${pendingBroadcasts.length} pending broadcasts`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error("[process-scheduled-broadcasts] Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})