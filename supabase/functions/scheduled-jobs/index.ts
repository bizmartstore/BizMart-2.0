import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    // Use anon key instead of service role key for scheduled jobs
    // This limits database access to only what's needed
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!  // Use anon key instead of service role key
    )

    // Get all pending scheduled jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('next_run_at', new Date().toISOString())
      .order('next_run_at', { ascending: true })
      .limit(50)  // Limit to prevent excessive processing

    if (jobsError) throw jobsError

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No pending jobs' }), { headers: corsHeaders })
    }

    console.log(`[scheduled-jobs] Found ${jobs.length} pending jobs`)

    // Process each job
    for (const job of jobs) {
      try {
        if (job.job_type === 'broadcast') {
          // Mark job as running
          await supabase
            .from('scheduled_jobs')
            .update({ status: 'running' })
            .eq('id', job.id)

          // Trigger the broadcast via edge function
          const broadcastPayload = job.payload
          const { error: broadcastError } = await supabase.functions.invoke("broadcast-push", {
            body: {
              title: broadcastPayload.title,
              message: broadcastPayload.message,
              link: broadcastPayload.link,
              icon: broadcastPayload.icon
            }
          })

          if (broadcastError) throw broadcastError

          // Mark job as completed
          await supabase
            .from('scheduled_jobs')
            .update({
              status: 'completed',
              last_run_at: new Date().toISOString()
            })
            .eq('id', job.id)

          console.log(`[scheduled-jobs] Completed broadcast job ${job.id}`)
        }
      } catch (jobError) {
        console.error(`[scheduled-jobs] Error processing job ${job.id}:`, jobError)
        await supabase
          .from('scheduled_jobs')
          .update({
            status: 'failed',
            last_run_at: new Date().toISOString()
          })
          .eq('id', job.id)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: jobs.length,
      completed: jobs.filter(j => j.job_type === 'broadcast').length
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error(`[scheduled-jobs] Error:`, error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})
