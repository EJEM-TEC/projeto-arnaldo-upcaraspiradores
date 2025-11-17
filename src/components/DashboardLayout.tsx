'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  subtitle?: string;
  title?: string;
}

interface ModalState {
  type: 'privacidade' | 'termos' | 'cancelar_assinatura' | null;
  open: boolean;
}

export default function DashboardLayout({ children, subtitle, title }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>({ type: null, open: false });
  const [isCancelling, setIsCancelling] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    setUserMenuOpen(false);
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      const response = await fetch('/api/payment/subscription-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: user?.user_metadata?.subscription_id || '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Assinatura cancelada com sucesso!');
        setModal({ type: null, open: false });
      } else {
        alert(`Erro ao cancelar assinatura: ${data.error}`);
      }
    } catch (error) {
      alert('Erro ao processar cancelamento');
      console.error('Cancel subscription error:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const menuItems = [
    { name: 'Novo Crédito', icon: '💲', href: '/painel_de_controle' },
    { name: 'Faturamento', icon: '📄', href: '/painel_de_controle?view=faturamento' },
    { name: 'Histórico do Caixa', icon: '💰', href: '/painel_de_controle?view=historico_caixa' },
    { name: 'Histórico de Acionamentos', icon: '📋', href: '/painel_de_controle?view=historico_acionamentos' },
    { name: 'Equipamentos', icon: '🔧', href: '/painel_de_controle?view=equipamentos' },
    { name: 'Alterar Senha', icon: '🔐', href: '/painel_de_controle?view=alterar_senha' },
    { name: 'Cancelar Assinatura', icon: '❌', onClick: () => setModal({ type: 'cancelar_assinatura', open: true }) },
    { name: 'Política de Privacidade', icon: '📋', onClick: () => setModal({ type: 'privacidade', open: true }) },
    { name: 'Termos de Uso', icon: '⚖️', onClick: () => setModal({ type: 'termos', open: true }) },
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
                width={200} 
                height={90}
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
            {menuItems.slice(0, -2).map((item) => (
              item.href ? (
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
              ) : (
                <button
                  key={item.name}
                  onClick={() => item.onClick?.()}
                  className="w-full flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors text-gray-100 hover:text-white group"
                  title={sidebarOpen ? '' : item.name}
                >
                  <span className="text-xl min-w-6 text-center">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="ml-3 text-sm font-medium">{item.name}</span>
                  )}
                </button>
              )
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
        {/* Header - Fundo branco com dropdown de usuário */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
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
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-900">
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

      {/* Modal de Política de Privacidade */}
      {modal.open && modal.type === 'privacidade' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Política de Privacidade</h2>
              <button
                onClick={() => setModal({ type: null, open: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 text-sm text-gray-700 space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">1. Informações que Coletamos</h3>
                <p>Coletamos diferentes tipos de informações para fornecer e melhorar nosso serviço:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Dados de Cadastro:</strong> Nome e Endereço de e-mail</li>
                  <li><strong>Dados de Pagamento:</strong> Processados pelo Mercado Pago</li>
                  <li><strong>Dados de Saldo:</strong> Registro de saldo, gastos e tempo de uso</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">2. Como Usamos Suas Informações</h3>
                <p>Fornecimento de serviços, comunicação, suporte ao cliente, melhoria de serviços e segurança.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">3. Compartilhamento de Informações</h3>
                <p>Não vendemos suas informações pessoais. Compartilhamos apenas com provedores de pagamento e quando exigido por lei.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">4. Seus Direitos (LGPD)</h3>
                <p>Você tem direito a acessar, corrigir, solicitar anonimização ou eliminação de seus dados. Entre em contato: <strong>arnaldfirst@gmail.com</strong></p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">5. Segurança dos Dados</h3>
                <p>Empregamos medidas de segurança técnicas e administrativas para proteger seus dados.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Termos de Uso */}
      {modal.open && modal.type === 'termos' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Termos de Uso e Condições</h2>
              <button
                onClick={() => setModal({ type: null, open: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 text-sm text-gray-700 space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">1. Descrição do Serviço</h3>
                <p>A UpCarAspiradores fornece acesso a equipamentos de aspiração de veículos. Os usuários devem criar uma conta e adicionar créditos (&quot;Saldo&quot;).</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">2. Elegibilidade e Conta de Usuário</h3>
                <p>Você deve ter pelo menos 18 anos para criar uma conta. Você é responsável por manter a confidencialidade de sua senha.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">3. Pagamentos e Saldo</h3>
                <p>Todos os pagamentos são processados pelo Mercado Pago. O Saldo não é reembolsável, exceto em caso de falha comprovada do sistema.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">4. Obrigações do Usuário</h3>
                <p>Você concorda em utilizar os equipamentos de forma segura, não causar danos intencionais e não usar o serviço para fins ilegais.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">5. Lei Aplicável</h3>
                <p>Estes Termos serão regidos pelas leis do Brasil. <strong>E-mail:</strong> arnaldfirst@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelar Assinatura */}
      {modal.open && modal.type === 'cancelar_assinatura' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Cancelar Assinatura</h2>
              <button
                onClick={() => setModal({ type: null, open: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 mb-3">
                  <strong>Atenção!</strong> Esta ação cancelará sua assinatura mensal. Você não receberá mais créditos automáticos.
                </p>
                <p className="text-sm text-red-700">
                  Tem certeza que deseja cancelar sua assinatura?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setModal({ type: null, open: false })}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:opacity-50"
                >
                  Não, manter assinatura
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelando...' : 'Sim, cancelar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
