import { createClient } from '@supabase/supabase-js';

// Fallback to prevent app crash if vars are missing (Vercel white screen fix)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase Environment Variables - App will not function correctly');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
