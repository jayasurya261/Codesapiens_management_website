// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

console.log('Supabase URL present:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Anon Key present:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);