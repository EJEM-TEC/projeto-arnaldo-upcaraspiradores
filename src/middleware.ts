import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Se o usuário não está logado, protege as rotas
  if (!user) {
    if (req.nextUrl.pathname.startsWith('/painel_de_controle') || 
        req.nextUrl.pathname.startsWith('/cliente') || 
        req.nextUrl.pathname.startsWith('/home')) {
      return NextResponse.redirect(new URL('/login-usuario', req.url))
    }
    return response
  }

  // Se o usuário está logado, busca sua 'role' do usuário
  const { data: profile } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  // Se não tem role na tabela, verifica se é admin pelo email
  let userRole = profile?.role
  if (!userRole) {
    // Verifica se o email é de admin (você pode ajustar esta lógica)
    userRole = user.email === 'arnaldfirst@gmail.com' ? 'admin' : 'cliente'
  }

  // Se o usuário logado tenta acessar a página de login, redireciona para seu painel
  if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/login-usuario') {
    return NextResponse.redirect(new URL(userRole === 'admin' ? '/painel_de_controle' : '/home', req.url))
  }

  // Se um 'cliente' tenta acessar uma página de 'admin'
  if (req.nextUrl.pathname.startsWith('/painel_de_controle') && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  // Se um 'admin' tenta acessar uma página de 'cliente'
  if (req.nextUrl.pathname.startsWith('/cliente') && userRole !== 'cliente') {
    return NextResponse.redirect(new URL('/painel_de_controle', req.url))
  }

  return response
}

export const config = {
  matcher: ['/painel_de_controle/:path*', '/cliente/:path*', '/login', '/login-usuario', '/home/:path*'],
};