import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use import.meta.env with fallback to prevent Invalid supabaseUrl errors
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://default-project.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('[Supabase] Missing required environment variables. Using placeholder values.');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Debug helper
console.log(`[Supabase] Initialized with URL: ${SUPABASE_URL?.slice(0, 20)}...`);