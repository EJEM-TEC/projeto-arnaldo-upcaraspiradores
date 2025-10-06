'use client'

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import { obterClientePorId } from '@/lib/clientes';
import MudarSenhaForm from './mudar-senha';
import { AddMachineForm } from './AddMachineForm';

type DashboardView = 'adicionar_credito' | 'faturamento' | 'historico_acionamentos' | 'historico_caixa' | 'equipamentos' | 'alterar_senha' | 'adicionar_maquina';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<DashboardView>('adicionar_credito');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [loadingClient, setLoadingClient] = useState(false);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view && ['faturamento', 'historico_acionamentos', 'historico_caixa', 'equipamentos', 'alterar_senha', 'adicionar_maquina'].includes(view)) {
      setCurrentView(view as DashboardView);
    } else {
      setCurrentView('adicionar_credito');
    }
  }, [searchParams]);

  const fetchClientName = async (id: string) => {
    if (!id.trim()) {
      setClientName('');
      return;
    }

    setLoadingClient(true);
    try {
      const clientId = parseInt(id);
      const cliente = obterClientePorId(clientId);
      setClientName(cliente ? cliente.name : 'Cliente não encontrado');
    } catch {
      setClientName('Cliente não encontrado');
    } finally {
      setLoadingClient(false);
    }
  };

  const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClientId(value);
    fetchClientName(value);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'adicionar_credito':
        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Adicionar Crédito</h2>
            {/* Credit Addition Form */}
            <div className="bg-gray-50 p-6 rounded-lg">

              <div className="max-w-md">
                <form className="space-y-4">
                  <div>
                    <label htmlFor="client-id" className="block text-sm font-medium text-gray-700 mb-2">
                      ID do cliente
                    </label>
                    <input
                      type="number"
                      id="client-id"
                      value={clientId}
                      onChange={handleClientIdChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                      placeholder="Digite o ID do cliente"
                    />
                  </div>

                  <div>
                    <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do cliente
                    </label>
                    <input
                      type="text"
                      id="client-name"
                      value={loadingClient ? 'Carregando...' : clientName}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      placeholder="Nome será exibido aqui"
                    />
                  </div>

                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                      Valor do Crédito
                    </label>
                    <input
                      type="number"
                      id="amount"
                      min="1"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                      placeholder="Digite o valor"
                    />
                  </div>

                  <div>
                    <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pagamento
                    </label>
                    <select
                      id="payment-method"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    >
                      <option value="">Selecione o método</option>
                      <option value="credit-card">Cartão de Crédito</option>
                      <option value="debit-card">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition"
                  >
                    Adicionar Crédito
                  </button>
                </form>
              </div>
            </div>
          </>
        );

      case 'faturamento':
        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Faturamento</h2>
            <div className="bg-gray-300 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Conteúdo do Faturamento</h3>
            </div>
          </>
        );

      case 'historico_acionamentos':
        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Histórico de Acionamentos</h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Aspirador #001</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15/01/2024 14:30</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">25 min</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Concluído</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Aspirador #002</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15/01/2024 15:45</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18 min</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Concluído</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        );

      case 'historico_caixa':
        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Histórico de Caixa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Entradas</h3>
                <p className="text-3xl font-bold">R$ 12.450</p>
                <p className="text-green-100 text-sm">Hoje</p>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Saídas</h3>
                <p className="text-3xl font-bold">R$ 3.200</p>
                <p className="text-red-100 text-sm">Hoje</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15/01/2024</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Pagamento cliente #123</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Entrada</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">+R$ 150,00</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15/01/2024</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Manutenção equipamento</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Saída</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">-R$ 85,00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        );

      case 'equipamentos':
        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Equipamentos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Total Equipamentos</h3>
                <p className="text-3xl font-bold">24</p>
                <p className="text-blue-100 text-sm">Cadastrados</p>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Ativos</h3>
                <p className="text-3xl font-bold">22</p>
                <p className="text-green-100 text-sm">Em funcionamento</p>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Manutenção</h3>
                <p className="text-3xl font-bold">2</p>
                <p className="text-red-100 text-sm">Precisam reparo</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#001</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aspirador Pro 2000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Shopping Center</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Ativo</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#002</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aspirador Pro 2000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aeroporto</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Manutenção</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        );

      case 'alterar_senha':
        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Alterar Senha</h2>
            <div className="max-w-md">
              <MudarSenhaForm
                onSuccess={() => {
                  console.log('Senha alterada com sucesso!');
                }}
                onError={(error) => {
                  console.error('Erro ao alterar senha:', error);
                }}
              />
            </div>
          </>
        );

      case 'adicionar_maquina':
        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Adicionar Máquina</h2>
            <div className="max-w-md">
              <AddMachineForm />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case 'adicionar_credito':
        return undefined;
      case 'faturamento':
        return undefined;
      case 'historico_acionamentos':
        return undefined;
      case 'historico_caixa':
        return undefined;
      case 'equipamentos':
        return undefined;
      case 'alterar_senha':
        return undefined;
      default:
        return undefined;
    }
  };

  return (
    <DashboardLayout
      subtitle={getSubtitle()}
    >
      {/* Content */}
      {renderContent()}
    </DashboardLayout>
  );
}
