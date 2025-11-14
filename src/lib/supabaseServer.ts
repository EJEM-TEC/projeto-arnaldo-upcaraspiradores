import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    '❌ Variáveis de ambiente do Supabase (service role) não configuradas!\n\n' +
    'Por favor, adicione ao arquivo .env.local:\n\n' +
    'SUPABASE_SERVICE_ROLE_KEY=your_service_role_key\n\n' +
    'Obtenha essa credencial em: https://supabase.com/dashboard/project/_/settings/api'
  );
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
