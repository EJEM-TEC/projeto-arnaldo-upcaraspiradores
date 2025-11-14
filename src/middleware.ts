import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Ignora rotas de API (incluindo webhooks)
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

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
        set(name: string, value: string, options?: Record<string, unknown>) {
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
        remove(name: string, options?: Record<string, unknown>) {
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
    .maybeSingle()

  // arnaldfirst@gmail.com é sempre admin (prioridade sobre role na tabela)
  let userRole = user.email === 'arnaldfirst@gmail.com' ? 'admin' : profile?.role
  if (!userRole) {
    userRole = 'cliente'
  }

  // Se o usuário logado tenta acessar a página de login-usuario, redireciona para seu painel
  // Mas permite acesso ao /login mesmo estando logado (para permitir logout/login de outro usuário)
  if (req.nextUrl.pathname === '/login-usuario') {
    return NextResponse.redirect(new URL(userRole === 'admin' ? '/painel_de_controle' : '/home', req.url))
  }

  // arnaldfirst@gmail.com pode acessar todas as páginas
  const isSuperAdmin = user.email === 'arnaldfirst@gmail.com'
  
  // Se um 'cliente' tenta acessar uma página de 'admin'
  if (req.nextUrl.pathname.startsWith('/painel_de_controle') && userRole !== 'admin' && !isSuperAdmin) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  // Se um 'cliente' tenta acessar uma página de 'home' (cliente normal), permite
  // Se um 'admin' tenta acessar 'home', permite (admins podem acessar site normal)
  // Ambos podem acessar /home, apenas não-admin e não-super-admin são redirecionados de /painel_de_controle

  return response
}

export const config = {
  matcher: ['/painel_de_controle/:path*', '/cliente/:path*', '/login', '/login-usuario', '/home/:path*'],
};