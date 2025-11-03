'use client'

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import { obterClientePorId } from '@/lib/clientes';
import MudarSenhaForm from './mudar-senha';
import { AddMachineForm } from './AddMachineForm';
import { getAllMachines, Machine, getAllActivationHistory, ActivationHistory, createTransaction, getBillingData, Transaction, BillingData } from '@/lib/database';

interface ActivationHistoryWithMachine extends ActivationHistory {
  machines?: {
    id: number;
    location?: string;
  } | null;
}

type DashboardView = 'adicionar_credito' | 'faturamento' | 'historico_acionamentos' | 'equipamentos' | 'alterar_senha' | 'adicionar_maquina';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<DashboardView>('adicionar_credito');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [loadingClient, setLoadingClient] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [activationHistory, setActivationHistory] = useState<ActivationHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const view = searchParams.get('view');
    if (view && ['faturamento', 'historico_acionamentos', 'equipamentos', 'alterar_senha', 'adicionar_maquina'].includes(view)) {
      setCurrentView(view as DashboardView);
    } else {
      setCurrentView('adicionar_credito');
    }
  }, [searchParams]);

  // Buscar máquinas quando a view for equipamentos ou ao montar o componente
  useEffect(() => {
    const fetchMachines = async () => {
      if (currentView === 'equipamentos' || currentView === 'adicionar_maquina') {
        setLoadingMachines(true);
        const { data, error } = await getAllMachines();
        if (error) {
          console.error('Erro ao buscar máquinas:', error);
        } else {
          setMachines(data || []);
        }
        setLoadingMachines(false);
      }
    };

    fetchMachines();
  }, [currentView]);

  // Buscar histórico de acionamentos quando a view for historico_acionamentos
  useEffect(() => {
    const fetchActivationHistory = async () => {
      if (currentView === 'historico_acionamentos') {
        setLoadingHistory(true);
        const { data, error } = await getAllActivationHistory();
        if (error) {
          console.error('Erro ao buscar histórico de acionamentos:', error);
        } else {
          setActivationHistory(data || []);
        }
        setLoadingHistory(false);
      }
    };

    fetchActivationHistory();
  }, [currentView]);


  // Buscar dados de faturamento quando a view for faturamento
  useEffect(() => {
    const fetchBillingData = async () => {
      if (currentView === 'faturamento') {
        setLoadingBilling(true);

        const now = new Date();
        let startDate: Date;
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        switch (billingPeriod) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            break;
          case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        }

        const { data, error } = await getBillingData(startDate.toISOString(), endDate.toISOString());

        if (error) {
          console.error('Erro ao buscar dados de faturamento:', error);
        } else {
          setBillingData(data);
        }

        setLoadingBilling(false);
      }
    };

    fetchBillingData();
  }, [currentView, billingPeriod]);

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
        const handleAddCredit = async (e: React.FormEvent) => {
          e.preventDefault();

          if (!clientId.trim() || !amount.trim() || !paymentMethod) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
          }

          const amountValue = parseFloat(amount);
          if (isNaN(amountValue) || amountValue <= 0) {
            alert('Por favor, informe um valor válido maior que zero.');
            return;
          }

          try {
            // Buscar o UUID do usuário pelo ID (assumindo que clientId é o ID na tabela usuarios)
            // Se não encontrar, criar transação sem user_id
            let userId = null;
            if (clientId.trim()) {
              try {
                const clientIdNum = parseInt(clientId);
                // Se for um número, pode ser que precise buscar de outra forma
                // Por enquanto, vamos usar o clientId como está se for UUID
                userId = clientId.trim();
              } catch {
                // Se não for um número, assume que é UUID
                userId = clientId.trim();
              }
            }

            const description = clientName
              ? `Crédito adicionado para ${clientName}`
              : `Crédito adicionado - Cliente ID: ${clientId}`;

            const { data, error } = await createTransaction({
              user_id: userId || undefined,
              amount: amountValue,
              type: 'entrada',
              description: description,
              payment_method: paymentMethod,
            });

            if (error) {
              alert(`Erro ao adicionar crédito: ${error.message}`);
            } else {
              alert(`Crédito de R$ ${amountValue.toFixed(2)} adicionado com sucesso!`);
              // Limpar formulário
              setClientId('');
              setClientName('');
              setAmount('');
              setPaymentMethod('');

              // Recarregar histórico de caixa se estiver visível
              // Isso será feito automaticamente pelo useEffect quando currentView mudar
            }
          } catch (error) {
            console.error('Erro ao adicionar crédito:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            alert(`Erro ao adicionar crédito: ${errorMessage}`);
          }
        };

        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Adicionar Crédito</h2>
            {/* Credit Addition Form */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="max-w-md">
                <form className="space-y-4" onSubmit={handleAddCredit}>
                  <div>
                    <label htmlFor="client-id" className="block text-sm font-medium text-gray-700 mb-2">
                      ID do cliente (UUID ou ID numérico)
                    </label>
                    <input
                      type="text"
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
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                      placeholder="Digite o valor"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pagamento
                    </label>
                    <select
                      id="payment-method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                      required
                    >
                      <option value="">Selecione o método</option>
                      <option value="credit-card">Cartão de Crédito</option>
                      <option value="debit-card">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                      <option value="cash">Dinheiro</option>
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
        const periodLabels = {
          today: 'Hoje',
          week: 'Últimos 7 dias',
          month: 'Este mês',
          year: 'Este ano'
        };

        return (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Faturamento</h2>
              <select
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value as 'today' | 'week' | 'month' | 'year')}
                className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                <option value="today">Hoje</option>
                <option value="week">Últimos 7 dias</option>
                <option value="month">Este mês</option>
                <option value="year">Este ano</option>
              </select>
            </div>

            {loadingBilling ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando dados de faturamento...</p>
              </div>
            ) : billingData ? (
              <>
                {/* Cards de resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                    <h3 className="text-lg font-semibold mb-2">Receita Total</h3>
                    <p className="text-3xl font-bold">
                      R$ {billingData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-green-100 text-sm">{periodLabels[billingPeriod]}</p>
                  </div>

                  <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
                    <h3 className="text-lg font-semibold mb-2">Despesas</h3>
                    <p className="text-3xl font-bold">
                      R$ {billingData.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-red-100 text-sm">{periodLabels[billingPeriod]}</p>
                  </div>

                  <div className={`bg-gradient-to-r p-6 rounded-lg text-white ${billingData.netProfit >= 0
                    ? 'from-blue-500 to-blue-600'
                    : 'from-orange-500 to-orange-600'
                    }`}>
                    <h3 className="text-lg font-semibold mb-2">Lucro Líquido</h3>
                    <p className="text-3xl font-bold">
                      R$ {billingData.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-blue-100 text-sm">{periodLabels[billingPeriod]}</p>
                  </div>
                </div>

                {/* Estatísticas adicionais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Faturamento por Método de Pagamento</h3>
                    {Object.keys(billingData.byPaymentMethod).length === 0 ? (
                      <p className="text-gray-500">Nenhum dado disponível</p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(billingData.byPaymentMethod).map(([method, amount]) => {
                          const methodLabels: Record<string, string> = {
                            'credit-card': 'Cartão de Crédito',
                            'debit-card': 'Cartão de Débito',
                            'pix': 'PIX',
                            'cash': 'Dinheiro',
                            'outros': 'Outros'
                          };
                          return (
                            <div key={method} className="flex justify-between items-center">
                              <span className="text-gray-700">{methodLabels[method] || method}</span>
                              <span className="font-semibold text-gray-900">
                                R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Clientes</h3>
                    {billingData.byUser.length === 0 ? (
                      <p className="text-gray-500">Nenhum dado disponível</p>
                    ) : (
                      <div className="space-y-3">
                        {billingData.byUser.map((item, index: number) => (
                          <div key={item.user_id} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="text-gray-400 mr-2">#{index + 1}</span>
                              <span className="text-gray-700">{item.name || 'Usuário'}</span>
                            </div>
                            <span className="font-semibold text-gray-900">
                              R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumo de transações */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Resumo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">Total de Transações</p>
                      <p className="text-2xl font-bold text-gray-900">{billingData.transactionCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">Transações de Entrada</p>
                      <p className="text-2xl font-bold text-green-600">
                        {billingData.transactions.filter((t: Transaction) => t.type === 'entrada').length}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">Transações de Saída</p>
                      <p className="text-2xl font-bold text-red-600">
                        {billingData.transactions.filter((t: Transaction) => t.type === 'saida').length}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500">Não foi possível carregar os dados de faturamento.</p>
                <p className="text-gray-400 text-sm mt-2">Verifique se a tabela 'transactions' foi criada no Supabase.</p>
              </div>
            )}
          </>
        );

      case 'historico_acionamentos':
        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Histórico de Acionamentos</h2>
            {loadingHistory ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando histórico...</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {activationHistory.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>Nenhum acionamento registrado ainda.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipamento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comando</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp. Média</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activationHistory.map((activation) => {
                        // Formatar data/hora
                        const startDate = activation.started_at
                          ? new Date(activation.started_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : '-';

                        // Calcular duração
                        let durationText = '-';
                        if (activation.duration_minutes) {
                          durationText = `${activation.duration_minutes} min`;
                        } else if (activation.ended_at && activation.started_at) {
                          const start = new Date(activation.started_at);
                          const end = new Date(activation.ended_at);
                          const diffMs = end.getTime() - start.getTime();
                          const diffMinutes = Math.floor(diffMs / 60000);
                          durationText = `${diffMinutes} min`;
                        } else if (activation.started_at) {
                          const start = new Date(activation.started_at);
                          const now = new Date();
                          const diffMs = now.getTime() - start.getTime();
                          const diffMinutes = Math.floor(diffMs / 60000);
                          durationText = `${diffMinutes} min (em andamento)`;
                        }

                        // Status e cor
                        const status = activation.status || 'em_andamento';
                        const statusText = status === 'concluído' || status === 'concluido' ? 'Concluído' :
                          status === 'em_andamento' ? 'Em Andamento' :
                            status;
                        const statusClass = status === 'concluído' || status === 'concluido' ?
                          'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800';

                        // Nome do equipamento
                        const activationWithMachine = activation as ActivationHistoryWithMachine;
                        const machineName = activationWithMachine.machines?.location
                          ? `Aspirador #${activation.machine_id} - ${activationWithMachine.machines.location}`
                          : `Aspirador #${activation.machine_id}`;

                        // Comando
                        const commandText = activation.command === 'on' ? 'Ligado' :
                          activation.command === 'off' ? 'Desligado' :
                            activation.command;

                        // Temperatura média
                        const avgTemp = activation.average_temperature !== null && activation.average_temperature !== undefined
                          ? `${activation.average_temperature.toFixed(1)}°C`
                          : '-';

                        return (
                          <tr key={activation.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {machineName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {startDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {commandText}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {durationText}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {avgTemp}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        );


      case 'equipamentos':
        const totalMachines = machines.length;
        const activeMachines = machines.filter(m => m.status === 'ativo' || m.status === 'active' || !m.status).length;
        const maintenanceMachines = machines.filter(m => m.status === 'manutenção' || m.status === 'maintenance').length;

        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Equipamentos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Total Equipamentos</h3>
                <p className="text-3xl font-bold">{totalMachines}</p>
                <p className="text-blue-100 text-sm">Cadastrados</p>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Ativos</h3>
                <p className="text-3xl font-bold">{activeMachines}</p>
                <p className="text-green-100 text-sm">Em funcionamento</p>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Manutenção</h3>
                <p className="text-3xl font-bold">{maintenanceMachines}</p>
                <p className="text-red-100 text-sm">Precisam reparo</p>
              </div>
            </div>

            {loadingMachines ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando equipamentos...</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {machines.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>Nenhuma máquina cadastrada ainda.</p>
                    <p className="mt-2 text-sm">Use a opção "Adicionar Máquina" no menu para cadastrar.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadastrada em</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {machines.map((machine) => {
                        const status = machine.status || 'ativo';
                        const statusText = status === 'ativo' || status === 'active' ? 'Ativo' :
                          status === 'manutenção' || status === 'maintenance' ? 'Manutenção' :
                            status;
                        const statusClass = status === 'ativo' || status === 'active' ?
                          'bg-green-100 text-green-800' :
                          status === 'manutenção' || status === 'maintenance' ?
                            'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800';

                        const createdAt = machine.created_at ?
                          new Date(machine.created_at).toLocaleDateString('pt-BR') :
                          '-';

                        return (
                          <tr key={machine.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{machine.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{machine.location || 'Não especificada'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{createdAt}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
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
              <AddMachineForm onSuccess={() => {
                // Recarregar lista de máquinas após adicionar
                getAllMachines().then(({ data }) => {
                  if (data) {
                    setMachines(data);
                  }
                });
              }} />
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
