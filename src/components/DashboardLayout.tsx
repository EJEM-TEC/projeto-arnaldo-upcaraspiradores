'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  subtitle?: string;
}

export default function DashboardLayout({ children, subtitle }: DashboardLayoutProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };


  const menuItems = [
    { name: 'Adicionar Crédito', icon: '💲', href: '/painel_de_controle' },
    { name: 'Faturamento', icon: '📄', href: '/painel_de_controle?view=faturamento' },
    { name: 'Histórico de Acionamentos', icon: '📋', href: '/painel_de_controle?view=historico_acionamentos' },
    { name: 'Equipamentos', icon: '🔧', href: '/painel_de_controle?view=equipamentos' },
    { name: 'Adicionar Máquina', icon: '➕', href: '/painel_de_controle?view=adicionar_maquina' },
    { name: 'Alterar Senha', icon: '🔐', href: '/painel_de_controle?view=alterar_senha' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Black Sidebar */}
      <div className={`bg-black text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-21'}`}>
        <div className="p-4">
          {/* Logo/Brand */}
          <div className="flex items-center mb-8">
            <Image 
              src="/upcar_preto.png" 
              alt="Logo" 
              width={50} 
              height={50}
              className="cursor-pointer mx-auto"
              onClick={() => router.push('/')} 
            />
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 mb-6 bg-orange-600 rounded-lg hover:bg-orange-800 transition"
          >
            <span className="text-lg">{sidebarOpen ? '←' : '→'}</span>
          </button>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center p-3 rounded-lg hover:bg-gray-800 transition group"
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Sign Out Button */}
          <div className="mt-8 pt-4 border-t border-gray-700">
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Seja bem-vindo(a) ao painel administrativo da UpCarAspiradores!</span>
            </div>
            <div className="flex space-x-4">
              <button
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-800 transition"
                onClick={handleSignOut}
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {subtitle && (
              <p className="text-gray-600 mb-6">{subtitle}</p>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
