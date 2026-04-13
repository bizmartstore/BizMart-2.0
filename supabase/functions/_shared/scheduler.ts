// Scheduler utility for edge functions
// This file provides helper functions for scheduling and managing cron jobs

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Verify JWT token manually
 */
export async function verifyAuth(req: Request): Promise<{ valid: boolean; error?: string }> {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    return { valid: false, error: 'Unauthorized' }
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? "https://zvtwkhlmexvkefgwvfdp.supabase.co"
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Verify JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { valid: false, error: 'Invalid token' }
    }
    
    return { valid: true }
  } catch (err) {
    console.error("[scheduler] Auth verification error:", err)
    return { valid: false, error: 'Authentication failed' }
  }
}

/**
 * Log function execution with standardized format
 */
export function logExecution(functionName: string, message: string, data?: any) {
  console.log(`[${functionName}] ${message}`, data ? { data } : '')
}

/**
 * Create a standardized response
 */
export function createResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        ...headers
      }
    }
  )
}

/**
 * Rate limiting helper
 */
let lastExecutionTime = 0
const MIN_EXECUTION_INTERVAL = 2 * 60 * 60 * 1000 // 2 hours in milliseconds

export function canExecuteNow(): boolean {
  const now = Date.now()
  if (now - lastExecutionTime >= MIN_EXECUTION_INTERVAL) {
    lastExecutionTime = now
    return true
  }
  return false
}
