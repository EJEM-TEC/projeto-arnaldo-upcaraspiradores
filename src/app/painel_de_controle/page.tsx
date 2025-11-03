'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/Dashboard';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkAuthAndRole = async () => {
      if (loading) return;

      if (!user) {
        router.push('/login-usuario');
        return;
      }

      // Verificar role do usuário
      try {
        // Buscar role da tabela usuarios
        const { data: profile } = await supabase
          .from('usuarios')
          .select('role')
          .eq('id', user.id)
          .single();

        // arnaldfirst@gmail.com é sempre admin (prioridade sobre role na tabela)
        let role = user.email === 'arnaldfirst@gmail.com' ? 'admin' : profile?.role;
        if (!role) {
          role = 'cliente';
        }

        setUserRole(role);

        // Se o usuário não é admin, redireciona para home
        if (role !== 'admin') {
          router.push('/home');
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar role:', error);
        // Em caso de erro, verifica pelo email como fallback
        // arnaldfirst@gmail.com é sempre admin
        const role = user.email === 'arnaldfirst@gmail.com' ? 'admin' : 'cliente';
        setUserRole(role);
        if (role !== 'admin') {
          router.push('/home');
          return;
        }
      } finally {
        setCheckingRole(false);
      }
    };

    checkAuthAndRole();
  }, [user, loading, router]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

