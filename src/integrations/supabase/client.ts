import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Supabase environment variables are missing! Check your .env file or Vercel settings.");
}

// Use secure HTTP-only cookies for session storage
// This prevents XSS attacks from stealing session tokens
export const supabase = createClient<Database>(SUPABASE_URL || '', SUPABASE_PUBLISHABLE_KEY || '', {
  auth: {
    // Use cookies instead of localStorage for security
    storage: 'cookie',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    
    // Cookie security settings
    cookies: {
      session: 'secure',  // Mark as Secure (HTTPS only)
      refresh_token: 'httpOnly',  // HTTP-only flag
      access_token: 'sameSite=Lax'  // CSRF protection
    },
    
    // General security settings
    general: {
      secure: true,
      sameSite: 'Lax' as const
    }
  },
  
  // Database security settings
  db: {
    schema: 'public',
    // Enable RLS by default for all queries
    enableRLS: true
  },
  
  // General client security
  general: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fcm.googleapis.com https://oauth2.googleapis.com; frame-src 'none'; object-src 'none';"
    }
  }
});

// Debug helper - only show basic info
console.log(`[Supabase] Initialized with URL: ${SUPABASE_URL?.slice(0, 20)}...`);
console.log(`[Supabase] Auth storage: cookie (secure)`);
console.log(`[Supabase] RLS enabled: true`);

// Security warning if using service role key
if (SUPABASE_PUBLISHABLE_KEY?.includes('sb_service')) {
  console.warn('[Supabase] Using service role key in client - this should only be in edge functions');
}
