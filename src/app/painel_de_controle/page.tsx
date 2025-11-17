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
        console.log(`[DASHBOARD] User logged in:`, user.email);

        // Buscar role da tabela usuarios
        const { data: profile } = await supabase
          .from('usuarios')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        console.log(`[DASHBOARD] Profile from DB:`, profile);

        // arnaldfirst@gmail.com é sempre admin (prioridade sobre role na tabela)
        const isArnald = user.email === 'arnaldfirst@gmail.com';
        console.log(`[DASHBOARD] Is arnaldfirst@gmail.com?:`, isArnald, `(email: ${user.email})`);
        
        let role = isArnald ? 'admin' : profile?.role;
        if (!role) {
          role = 'cliente';
        }

        console.log(`[DASHBOARD] Final role:`, role);
        setUserRole(role);

        // Se o usuário não é admin, redireciona para home
        if (role !== 'admin') {
          console.log(`[DASHBOARD] Not admin, redirecting to home`);
          router.push('/home');
          return;
        }
        console.log(`[DASHBOARD] Is admin, showing dashboard`);
      } catch (error) {
        console.error('[DASHBOARD ERROR] Erro ao verificar role:', error);
        // Em caso de erro, verifica pelo email como fallback
        // arnaldfirst@gmail.com é sempre admin
        const isArnald = user.email === 'arnaldfirst@gmail.com';
        console.log(`[DASHBOARD FALLBACK] Is arnaldfirst@gmail.com?:`, isArnald, `(email: ${user.email})`);
        const role = isArnald ? 'admin' : 'cliente';
        console.log(`[DASHBOARD FALLBACK] Final role:`, role);
        setUserRole(role);
        if (role !== 'admin') {
          console.log(`[DASHBOARD FALLBACK] Not admin, redirecting to home`);
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

