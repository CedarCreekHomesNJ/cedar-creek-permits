// lib/supabase.js
// Shared Supabase client used by every API route.
// SUPABASE_URL and SUPABASE_SERVICE_KEY are set as environment variables in
// Vercel (Project Settings → Environment Variables) -- never committed to
// the repo. The service key is used here (server-side only) so API routes
// can bypass RLS safely when needed; the publishable key is what the
// frontend uses directly for simple reads.
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase };
