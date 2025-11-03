// src/app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  // Se houver um erro (ex: usuário cancelou o login)
  if (error) {
    return NextResponse.redirect(`${requestUrl.origin}/login-usuario?error=${error}`);
  }

  // Se houver um código de autorização na URL, troque-o por uma sessão
  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    try {
      // Troca o código por uma sessão
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

      if (sessionError) {
        console.error('Error exchanging code for session:', sessionError);
        return NextResponse.redirect(`${requestUrl.origin}/login-usuario?error=auth_failed`);
      }

      // Obtém o usuário da sessão
      const user = sessionData?.user;

      if (user) {
        // Verifica se o perfil do usuário já existe na tabela usuarios
        const { data: existingProfile, error: profileError } = await supabase
          .from('usuarios')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        // Se o perfil não existe, cria um novo
        // Se existingProfile for null, significa que não encontrou (normal para novos usuários)
        if (!existingProfile && (!profileError || profileError.code === 'PGRST116')) {
          // Extrai o nome do usuário do metadata do Google
          const fullName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 
                          'Usuário';

          // Cria o perfil do usuário
          const { error: insertError } = await supabase
            .from('usuarios')
            .insert([
              {
                id: user.id,
                email: user.email || '',
                name: fullName,
                created_at: user.created_at || new Date().toISOString(),
                role: 'cliente', // Define como cliente por padrão
              },
            ]);

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            // Se o erro for de duplicação (perfil já existe), tudo bem
            if (insertError.code !== '23505') {
              // Erro diferente de duplicação - pode ser problema
              console.warn('Non-duplicate error when creating profile:', insertError);
            }
          } else {
            console.log('User profile created successfully for:', user.email);
          }
        } else if (profileError) {
          // Erro diferente de "não encontrado" - pode ser problema
          console.error('Error checking user profile:', profileError);
        } else if (existingProfile) {
          console.log('User profile already exists for:', user.email);
        }
      }
    } catch (error) {
      console.error('Unexpected error in OAuth callback:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login-usuario?error=unexpected_error`);
    }
  }

  // Redireciona o usuário para a página home (mobile dashboard) após o login
  return NextResponse.redirect(`${requestUrl.origin}/home`);
}