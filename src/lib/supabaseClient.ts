import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Variáveis de ambiente do Supabase não configuradas!\n\n' +
    'Por favor, crie um arquivo .env.local na raiz do projeto com:\n\n' +
    'NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here\n\n' +
    'Obtenha essas credenciais em: https://supabase.com/dashboard/project/_/settings/api'
  )
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

