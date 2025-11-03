// Em seu arquivo de página de login (ex: src/app/login/page.tsx)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient'; // Importa nosso cliente Supabase

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Começa true para verificar sessão
  const router = useRouter();

  // Verifica se o usuário já está logado ao carregar a página
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Se já estiver logado, verifica a role e redireciona
        try {
          const { data: profile } = await supabase
            .from('usuarios')
            .select('role')
            .eq('id', user.id)
            .single();

          // arnaldfirst@gmail.com é sempre admin
          let role = user.email === 'arnaldfirst@gmail.com' ? 'admin' : profile?.role;
          if (!role) {
            role = 'cliente';
          }

          if (role === 'admin') {
            router.push('/painel_de_controle');
          } else {
            router.push('/home');
          }
        } catch {
          // Em caso de erro, verifica pelo email como fallback
          // arnaldfirst@gmail.com é sempre admin
          const role = user.email === 'arnaldfirst@gmail.com' ? 'admin' : 'cliente';
          if (role === 'admin') {
            router.push('/painel_de_controle');
          } else {
            router.push('/home');
          }
        }
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Lógica de login com Supabase
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      setLoading(false);
    } else {
      // Após login bem-sucedido, verifica a role e redireciona
      if (data.user) {
        try {
          const { data: profile } = await supabase
            .from('usuarios')
            .select('role')
            .eq('id', data.user.id)
            .single();

          // arnaldfirst@gmail.com é sempre admin
          let role = data.user.email === 'arnaldfirst@gmail.com' ? 'admin' : profile?.role;
          if (!role) {
            role = 'cliente';
          }

          if (role === 'admin') {
            router.push('/painel_de_controle');
          } else {
            router.push('/home');
          }
        } catch {
          // Em caso de erro, verifica pelo email como fallback
          // arnaldfirst@gmail.com é sempre admin
          const role = data.user.email === 'arnaldfirst@gmail.com' ? 'admin' : 'cliente';
          if (role === 'admin') {
            router.push('/painel_de_controle');
          } else {
            router.push('/home');
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg p-8 shadow-md">
        <Image src="/upcar.png" alt="UpCar Logo" width={200} height={100} className="mx-auto mb-8" />
        <h1 className="text-2xl font-bold text-gray-900 text-center">PAINEL DE CONTROLE</h1>
        <h3 className="text-gray-600 text-center mb-8">Faça login para acessar o sistema</h3>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" placeholder="Senha" />
          <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50">
            {loading ? 'Carregando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}