import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

function isValidSupabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const isPlaceholderValue = (value: string) =>
  value.includes('<') || value.includes('>') || value.includes('your-project-ref') || value.includes('your-anon-public-key');

const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  isValidSupabaseUrl(supabaseUrl) &&
  !isPlaceholderValue(supabaseUrl) &&
  !isPlaceholderValue(supabaseAnonKey);

// Return null if Supabase is not properly configured
// This allows the app to work without database features
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    console.warn(
      'Supabase is not configured. Database features will be disabled. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
    return null;
  }

  try {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}
