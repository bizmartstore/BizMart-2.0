import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLIC_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) {
  console.error("Supabase environment variables are missing! Check your .env file or Vercel settings.");
}

// Add retry logic for Supabase client
const supabaseClient = createClient<Database>(
  SUPABASE_URL || '',
  SUPABASE_PUBLIC_KEY || '',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    // Add retry configuration
    global: {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }
  }
);

// Debug helper
console.log(`[Supabase] Initialized with URL: ${SUPABASE_URL?.slice(0, 20)}...`);

// Add error handling wrapper
export const supabase = {
  ...supabaseClient,
  from: (table: string) => {
    // Add retry logic for table access
    const maxRetries = 3;
    let retryCount = 0;

    const retryFetch = async (...args: any[]) => {
      try {
        return await supabaseClient.from(table).select(...args);
      } catch (error) {
        retryCount++;
        if (retryCount <= maxRetries) {
          console.warn(`[Supabase] Retry ${retryCount} for table ${table}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return retryFetch(...args);
        }
        throw error;
      }
    };

    return {
      ...supabaseClient.from(table),
      select: (...args: any[]) => retryFetch(...args)
    };
  }
};