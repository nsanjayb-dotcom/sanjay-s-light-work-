import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

/**
 * Supabase Admin Client (Server-Side Only)
 * 
 * Complies with Requirement 1:
 * - Uses SUPABASE_SERVICE_ROLE_KEY strictly on the server (Node.js/Express)
 * - NEVER exposed to browser/client-side code or public bundles
 * - Bypasses Row Level Security for trusted backend operations (e.g. admin pipeline sync, transactional batching)
 */

const getServiceRoleKey = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  }
  return '';
};

const getSupabaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return (
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      'https://placeholder-project.supabase.co'
    );
  }
  return 'https://placeholder-project.supabase.co';
};

const serviceRoleKey = getServiceRoleKey();
const supabaseUrl = getSupabaseUrl();

export const isSupabaseAdminConfigured = Boolean(
  serviceRoleKey && 
  supabaseUrl && 
  !supabaseUrl.includes('placeholder-project')
);

// Server-side service-role client instance
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  serviceRoleKey || 'placeholder-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-application-role': 'server-admin',
      },
    },
  }
);
