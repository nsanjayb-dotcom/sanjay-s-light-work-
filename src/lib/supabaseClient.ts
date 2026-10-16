import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

/**
 * Supabase Client Singleton Configuration
 * 
 * Complies with Requirement 1:
 * - Public anon key only in client bundle
 * - Fallback to mock-safe client if environment variables are not yet provided
 * - Strict singleton pattern to avoid multiple client instances
 */

const getEnvVar = (key: string): string => {
  // Support both Next.js/process.env and Vite/import.meta.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key] || import.meta.env[`VITE_${key.replace('NEXT_PUBLIC_', '')}`] || '';
  }
  return '';
};

const supabaseUrl = 
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 
  getEnvVar('VITE_SUPABASE_URL') || 
  'https://placeholder-project.supabase.co';

const supabaseAnonKey = 
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 
  getEnvVar('VITE_SUPABASE_ANON_KEY') || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  (getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL')) &&
  (getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY')) &&
  !supabaseUrl.includes('placeholder-project')
);

// Create Supabase singleton instance with Database typings
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-application-name': 'sanjays-lightworks-web',
      },
    },
  }
);
