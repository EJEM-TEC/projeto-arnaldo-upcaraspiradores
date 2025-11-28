import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    '❌ NEXT_PUBLIC_SUPABASE_URL não configurada!\n' +
    'Adicione ao arquivo .env.local:\n' +
    'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co'
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    '❌ SUPABASE_SERVICE_ROLE_KEY não configurada!\n' +
    'Adicione ao arquivo .env.local:\n' +
    'SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here'
  );
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});