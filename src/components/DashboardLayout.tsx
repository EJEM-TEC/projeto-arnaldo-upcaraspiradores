'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  subtitle?: string;
  title?: string;
}

export default function DashboardLayout({ children, subtitle, title }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    setUserMenuOpen(false);
  };

  const menuItems = [
    { name: 'Avisos', icon: '🔔', href: '/painel_de_controle?view=avisos' },
    { name: 'Novo Crédito', icon: '💲', href: '/painel_de_controle' },
    { name: 'Faturamento', icon: '📄', href: '/painel_de_controle?view=faturamento' },
    { name: 'Histórico do Caixa', icon: '💰', href: '/painel_de_controle?view=historico_caixa' },
    { name: 'Histórico de Acionamentos', icon: '📋', href: '/painel_de_controle?view=historico_acionamentos' },
    { name: 'Equipamentos', icon: '🔧', href: '/painel_de_controle?view=equipamentos' },
    { name: 'Alterar Senha', icon: '🔐', href: '/painel_de_controle?view=alterar_senha' },
    { name: 'Sair', icon: '🚪', href: '#', onClick: handleSignOut },
  ];

  return (
    <div className="min-h-screen flex bg-gray-200">
      {/* Sidebar - Cinza-escuro com ícones e navegação */}
      <div className={`bg-gray-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} shadow-lg`}>
        <div className="p-4 h-full flex flex-col">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center mb-8 py-4">
            {sidebarOpen ? (
              <Image 
                src="/upcar_preto.png" 
                alt="Logo" 
                width={140} 
                height={60}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push('/')}
                priority
              />
            ) : (
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center font-bold text-lg cursor-pointer hover:bg-orange-700 transition"
                onClick={() => router.push('/')}
              >
                U
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 mb-4 bg-orange-600 rounded-lg hover:bg-orange-700 transition text-white font-semibold"
          >
            <span className="text-lg">{sidebarOpen ? '‹' : '›'}</span>
          </button>

          {/* Navigation Menu - Flex grow para ocupar espaço */}
          <nav className="space-y-1 flex-grow">
            {menuItems.slice(0, -1).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors text-gray-100 hover:text-white group"
                title={sidebarOpen ? '' : item.name}
              >
                <span className="text-xl min-w-6 text-center">{item.icon}</span>
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Divider */}
          <div className="border-t border-gray-700 mb-2"></div>

          {/* Sign Out Button - Sempre no final */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors text-gray-100 hover:text-white"
            title={sidebarOpen ? '' : 'Sair'}
          >
            <span className="text-xl min-w-6 text-center">🚪</span>
            {sidebarOpen && (
              <span className="ml-3 text-sm font-medium">Sair</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header - Fundo amarelo com dropdown de usuário */}
        <header className="bg-yellow-400 shadow-md border-b border-yellow-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                {title || 'Painel Administrativo - UpCarAspiradores'}
              </h1>
            </div>
            <div className="flex items-center space-x-4 relative">
              {/* User Dropdown */}
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-gray-900">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span className="hidden sm:inline text-sm">{user?.email?.split('@')[0]}</span>
                <ChevronDown size={18} />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50" style={{ top: '100%' }}>
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                  >
                    🚪 Sair da conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area - Fundo cinza-claro */}
        <main className="flex-1 p-6 bg-gray-200 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            {subtitle && (
              <p className="text-gray-700 mb-6 font-medium">{subtitle}</p>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
