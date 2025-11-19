'use client'

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import MudarSenhaForm from './mudar-senha';
import { AddMachineForm } from './AddMachineForm';
import CashHistoryPage from '@/components/pages/CashHistoryPage';
<<<<<<< HEAD
import ExcelTemplateGenerator from './ExcelTemplateGenerator';
import ExcelUploader from './ExcelUploader';
=======
import { supabase } from '@/lib/supabaseClient';
>>>>>>> refs/remotes/origin/master
import { getAllMachines, Machine, getAllActivationHistory, ActivationHistory, createTransaction, getBillingData, Transaction, BillingData } from '@/lib/database';

interface ActivationHistoryWithMachine extends ActivationHistory {
  machines?: {
    id: number;
    location?: string;
  } | null;
}

interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

type MachineStats = {
  totalActivations: number;
  totalUsageMinutes: number;
  voltage: string | number | null;
  last_cleaning: string | null;
  created_at: string | null;
};

type DashboardView = 'adicionar_credito' | 'faturamento' | 'historico_acionamentos' | 'equipamentos' | 'alterar_senha' | 'adicionar_maquina' | 'historico_caixa' | 'importar_excel';

const MINUTE_RATE = 0.5;

type RevenueSummaryKey = 'posto' | 'app' | 'pix' | 'cartao';
type RevenueSummary = Record<RevenueSummaryKey, number>;

const INITIAL_REVENUE_SUMMARY: RevenueSummary = {
  posto: 0,
  app: 0,
  pix: 0,
  cartao: 0,
};

interface FinancialHistoryRow {
  equipamento: string;
  tempoEmMin: number;
  valorPorAspira: number;
  quantidade: number;
  saldoUtilizado: number;
}

const roundTwo = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const getDurationMinutes = (activation: ActivationHistory) => {
  if (typeof activation.duration_minutes === 'number') {
    return activation.duration_minutes;
  }

  if (activation.started_at && activation.ended_at) {
    const start = new Date(activation.started_at);
    const end = new Date(activation.ended_at);
    const diffMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    return diffMinutes;
  }

  return 0;
};

const getMachineDisplayName = (activation: ActivationHistoryWithMachine) => {
  const location = activation.machines?.location?.trim();
  return location
    ? `Aspirador #${activation.machine_id} - ${location}`
    : `Aspirador #${activation.machine_id}`;
};

const buildHistoryRows = (history: ActivationHistory[]): FinancialHistoryRow[] => {
  return history.map((activation) => {
    const duration = roundTwo(getDurationMinutes(activation));
    const valorPorAspira = MINUTE_RATE;
    const saldoUtilizado = roundTwo(duration * MINUTE_RATE);
    return {
      equipamento: getMachineDisplayName(activation as ActivationHistoryWithMachine),
      tempoEmMin: duration,
      valorPorAspira,
      quantidade: 1,
      saldoUtilizado,
    };
  });
};

const mapPaymentMethodToSummaryKey = (method?: string | null): RevenueSummaryKey => {
  const normalized = (method || '').toLowerCase();
  if (['pix', 'pix_qr', 'pix-app', 'pix app'].includes(normalized)) {
    return 'pix';
  }
  if (['credit-card', 'debit-card', 'card', 'visa', 'mastercard', 'amex', 'elo'].includes(normalized)) {
    return 'cartao';
  }
  if (['posto', 'cash', 'dinheiro', 'presencial', 'balcao'].includes(normalized)) {
    return 'posto';
  }
  return 'app';
};

const buildRevenueSummary = (
  transactions: Array<{ amount: number | null; payment_method: string | null }>
): RevenueSummary => {
  return transactions.reduce((acc, transaction) => {
    const key = mapPaymentMethodToSummaryKey(transaction.payment_method);
    acc[key] += transaction.amount || 0;
    return acc;
  }, { ...INITIAL_REVENUE_SUMMARY });
};

const buildWorksheetMatrix = (summary: RevenueSummary, rows: FinancialHistoryRow[]) => {
  const headerRow = ['Equipamento', 'Tempo em min', 'Valor por aspira', 'Quantidade', 'Saldo utilizado'];
  const dataRows = rows.map((row) => [
    row.equipamento,
    row.tempoEmMin,
    row.valorPorAspira,
    row.quantidade,
    row.saldoUtilizado,
  ]);

  return [
    ['Receita POSTO', 'Receita APP', 'Receita PIX', 'Receita CARTÃO'],
    [
      roundTwo(summary.posto),
      roundTwo(summary.app),
      roundTwo(summary.pix),
      roundTwo(summary.cartao),
    ],
    [],
    [],
    headerRow,
    ...dataRows,
  ];
};


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
  const [historyStart, setHistoryStart] = useState<string>('');
  const [historyEnd, setHistoryEnd] = useState<string>('');
  const [expandedMachines, setExpandedMachines] = useState<Record<number, boolean>>({});
  const [machineStats, setMachineStats] = useState<Record<number, MachineStats>>({});
  const [_cashHistoryStart, _setCashHistoryStart] = useState<string>('');
  const [_cashHistoryEnd, _setCashHistoryEnd] = useState<string>('');
  const [exportingHistory, setExportingHistory] = useState(false);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary>(INITIAL_REVENUE_SUMMARY);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view && ['faturamento', 'historico_acionamentos', 'equipamentos', 'alterar_senha', 'adicionar_maquina', 'historico_caixa', 'importar_excel'].includes(view)) {
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
        try {
          const { data, error } = await getAllMachines();
          console.log('Resultado getAllMachines:', { data, error });

          if (error) {
            console.error('Erro ao buscar máquinas:', error);
            const supabaseError = error as unknown as SupabaseError;
            console.error('Detalhes do erro:', {
              message: error.message,
              code: supabaseError.code,
              details: supabaseError.details,
              hint: supabaseError.hint
            });
            // Ainda assim, tenta definir como array vazio para não quebrar
            setMachines([]);
          } else {
            console.log('Máquinas encontradas:', data);
            setMachines(data || []);
          }
        } catch (err) {
          console.error('Erro inesperado ao buscar máquinas:', err);
          setMachines([]);
        } finally {
          setLoadingMachines(false);
        }
      }
    };

    fetchMachines();
  }, [currentView]);

  // Buscar histórico de acionamentos quando a view for historico_acionamentos
  useEffect(() => {
    const fetchActivationHistory = async () => {
      if (currentView === 'historico_acionamentos') {
        setLoadingHistory(true);
        const startIso = historyStart ? new Date(historyStart).toISOString() : undefined;
        const endIso = historyEnd ? new Date(new Date(historyEnd).setHours(23, 59, 59, 999)).toISOString() : undefined;
        const { data, error } = await getAllActivationHistory(startIso, endIso);
        if (error) {
          console.error('Erro ao buscar histórico de acionamentos:', error);
        } else {
          setActivationHistory(data || []);
        }
        setLoadingHistory(false);
      }
    };

    fetchActivationHistory();
  }, [currentView, historyStart, historyEnd]);

  useEffect(() => {
    const fetchRevenueSummary = async () => {
      if (currentView !== 'historico_acionamentos') {
        return;
      }

      try {
        const startIso = historyStart ? new Date(historyStart).toISOString() : undefined;
        const endIso = historyEnd
          ? new Date(new Date(historyEnd).setHours(23, 59, 59, 999)).toISOString()
          : undefined;

        let query = supabase
          .from('transactions')
          .select('amount,payment_method,created_at')
          .eq('type', 'entrada');

        if (startIso) {
          query = query.gte('created_at', startIso);
        }
        if (endIso) {
          query = query.lte('created_at', endIso);
        }

        const { data, error } = await query;
        if (error) {
          console.error('Erro ao buscar resumo financeiro:', error);
          setRevenueSummary(INITIAL_REVENUE_SUMMARY);
          return;
        }

        setRevenueSummary(buildRevenueSummary(data || []));
      } catch (err) {
        console.error('Erro inesperado ao calcular resumo financeiro:', err);
        setRevenueSummary(INITIAL_REVENUE_SUMMARY);
      }
    };

    fetchRevenueSummary();
  }, [currentView, historyStart, historyEnd]);


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

  useEffect(() => {
    const loadStats = async () => {
      if (currentView === 'equipamentos' && machines.length > 0) {
        console.log('Carregando estatísticas para', machines.length, 'máquinas');
        const { getMachineStats } = await import('@/lib/database');
        const entries = await Promise.all(
          machines.map(async (m) => {
            const { data } = await getMachineStats(m.id);
            return [m.id, data] as const;
          })
        );
        const map: Record<number, MachineStats | null> = {};
        entries.forEach(([id, data]) => { map[id] = data; });
        setMachineStats(map as Record<number, MachineStats>);
        console.log('Estatísticas carregadas:', map);
      } else {
        // Limpar estatísticas quando não estiver na view de equipamentos
        setMachineStats({});
      }
    };
    loadStats();
  }, [currentView, machines]);

  const fetchClientName = async (id: string) => {
    if (!id.trim()) {
      setClientName('');
      return;
    }

    setLoadingClient(true);
    try {
      const { getUserFullName } = await import('@/lib/database');
      const { data: userProfile } = await getUserFullName(id);

      // Debug log
      console.log('Fetched user profile:', { id, userProfile });

      if (userProfile?.full_name) {
        console.log('Setting client name to:', userProfile.full_name);
        setClientName(userProfile.full_name);
      } else {
        console.warn('User full_name not found for ID:', id);
        setClientName('Cliente não encontrado');
      }
    } catch (error) {
      console.error('Error fetching client name:', error);
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

  const _handleDownloadMachinePdf = async (machineId: number) => {
    try {
      const { getActivationHistoryByMachine } = await import('@/lib/database');
      const { data: history } = await getActivationHistoryByMachine(machineId);

      // Tentar importar jsPDF dinamicamente
      type JsPDFModule = {
        default?: {
          new(): JsPDFInstance;
        };
        new(): JsPDFInstance;
      };

      type JsPDFInstance = {
        setFontSize: (size: number) => void;
        text: (text: string, x: number, y: number, opts?: Record<string, unknown>) => void;
        setLineWidth: (width: number) => void;
        line: (x1: number, y1: number, x2: number, y2: number) => void;
        addPage: () => void;
        save: (filename: string) => void;
        setDrawColor: (r: number, g?: number, b?: number) => void;
        setFillColor: (r: number, g?: number, b?: number) => void;
        rect: (x: number, y: number, w: number, h: number, style: string) => void;
      };

      let jsPdfMod: JsPDFModule;
      try {
        jsPdfMod = (await import('jspdf') as unknown) as JsPDFModule;
      } catch {
        alert('Biblioteca jsPDF não encontrada. Execute: npm install jspdf');
        return;
      }

      const JsPDFClass = (jsPdfMod.default || jsPdfMod) as new () => JsPDFInstance;
      const jsPDF = JsPDFClass;
      const doc = new jsPDF();

      const machine = machines.find(m => m.id === machineId);
      const stats = machineStats[machineId];

      // --- CABEÇALHO ---
      let y = 15;
      doc.setFontSize(18);
      doc.setDrawColor(25, 118, 210);
      doc.setFillColor(230, 242, 255);
      doc.rect(14, y - 5, 182, 12, 'F');
      doc.text('RELATÓRIO DA MÁQUINA - UpCar Aspiradores', 14, y + 2);
      y += 20;

      // --- INFORMAÇÕES DA MÁQUINA ---
      doc.setFontSize(13);
      doc.setDrawColor(100, 100, 100);
      doc.text('INFORMAÇÕES DO EQUIPAMENTO', 14, y);
      y += 8;

      doc.setFontSize(11);
      doc.text(`ID da Máquina: ${machineId}`, 14, y); y += 6;
      doc.text(`Cidade: ${machine?.location || '-'}`, 14, y); y += 6;
      doc.text(`Endereço: ${machine?.address || '-'}`, 14, y); y += 6;
      doc.text(`Status: ${machine?.status || 'ativo'}`, 14, y); y += 6;
      doc.text(`Cadastrada em: ${stats?.created_at ? new Date(stats.created_at).toLocaleDateString('pt-BR') : '-'}`, 14, y); y += 8;

      // --- RESUMO DE USO (APIRACAR) ---
      doc.setFontSize(13);
      doc.setDrawColor(100, 100, 100);
      doc.text('RESUMO DE USO', 14, y);
      y += 8;

      doc.setFontSize(11);
      const totalMinutes = stats?.totalUsageMinutes ?? 0;
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;

      doc.text(`Total de Acionamentos: ${stats?.totalActivations ?? 0}`, 14, y); y += 6;
      doc.text(`Tempo Total de Uso: ${totalHours}h ${remainingMinutes}m (${totalMinutes} minutos)`, 14, y); y += 6;
      doc.text(`Temperatura Média: ${stats?.voltage ? 'OK' : '-'}`, 14, y); y += 6;
      doc.text(`Última Limpeza: ${stats?.last_cleaning ? new Date(stats.last_cleaning).toLocaleDateString('pt-BR') : '-'}`, 14, y); y += 8;

      // --- HISTÓRICO DE ACIONAMENTOS ---
      doc.setFontSize(13);
      doc.setDrawColor(100, 100, 100);
      doc.text('HISTÓRICO DE ACIONAMENTOS', 14, y);
      y += 8;

      // Cabeçalho da tabela
      doc.setFontSize(10);
      doc.setFillColor(200, 200, 200);
      doc.setDrawColor(100, 100, 100);

      const colWidths = [50, 20, 20, 20, 30];
      const cols = ['Data/Hora', 'Comando', 'Duração', 'Temp.', 'Status'];
      let xPos = 14;

      doc.setLineWidth(0.1);
      for (let i = 0; i < cols.length; i++) {
        doc.rect(xPos, y - 5, colWidths[i], 6, 'F');
        doc.text(cols[i], xPos + 2, y, { maxWidth: colWidths[i] - 4 });
        xPos += colWidths[i];
      }

      y += 8;
      doc.setFillColor(255, 255, 255);

      const rows = (history || []).slice(0, 200);
      for (const item of rows) {
        if (y > 270) {
          doc.addPage();
          y = 15;
        }

        const start = item.started_at ? new Date(item.started_at).toLocaleString('pt-BR', {
          month: '2-digit',
          day: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : '-';
        const cmd = item.command === 'on' ? 'Ligado' : item.command === 'off' ? 'Desligado' : item.command || '-';
        const dur = item.duration_minutes != null ? `${item.duration_minutes}m` : '-';
        const temp = item.average_temperature != null ? `${Number(item.average_temperature).toFixed(1)}°C` : '-';
        const st = item.status || '-';

        xPos = 14;
        const rowData = [start, cmd, dur, temp, st];
        for (let i = 0; i < rowData.length; i++) {
          doc.text(rowData[i], xPos + 2, y, { maxWidth: colWidths[i] - 4 });
          xPos += colWidths[i];
        }
        y += 6;
      }

      // Rodapé
      y += 10;
      doc.setFontSize(9);
      doc.setDrawColor(150, 150, 150);
      doc.line(14, y, 196, y);
      y += 4;
      doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, y);
      doc.text('UpCar Aspiradores - Sistema de Gestão', 155, y);

      doc.save(`relatorio_maquina_${machineId}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Não foi possível gerar o PDF. Verifique se as dependências estão instaladas.');
    }
  };

  const _handleDownloadRepaymentPdf = async (machineId: number) => {
    try {
      const { getActivationHistoryByMachine } = await import('@/lib/database');
      const { data: history } = await getActivationHistoryByMachine(machineId);

      type JsPDFModule = {
        default?: {
          new(): JsPDFInstance;
        };
        new(): JsPDFInstance;
      };

      type JsPDFInstance = {
        setFontSize: (size: number) => void;
        setTextColor: (r: number, g?: number, b?: number) => void;
        text: (text: string, x: number, y: number, opts?: Record<string, unknown>) => void;
        setLineWidth: (width: number) => void;
        line: (x1: number, y1: number, x2: number, y2: number) => void;
        addPage: () => void;
        save: (filename: string) => void;
        setDrawColor: (r: number, g?: number, b?: number) => void;
        setFillColor: (r: number, g?: number, b?: number) => void;
        rect: (x: number, y: number, w: number, h: number, style?: string) => void;
        getTextWidth: (text: string) => number;
      };

      let jsPdfMod: JsPDFModule;
      try {
        jsPdfMod = (await import('jspdf') as unknown) as JsPDFModule;
      } catch {
        alert('Biblioteca jsPDF não encontrada. Execute: npm install jspdf');
        return;
      }

      const JsPDFClass = (jsPdfMod.default || jsPdfMod) as new () => JsPDFInstance;
      const doc = new JsPDFClass();

      const machine = machines.find(m => m.id === machineId);
      const stats = machineStats[machineId];

      // ========== PÁGINA 1: SUMÁRIO ==========
      let y = 15;

      // Cabeçalho com marca
      doc.setFontSize(16);
      doc.setTextColor(220, 100, 0);
      doc.text('AspiraCar connect', 14, y);
      doc.setTextColor(0, 0, 0);
      y += 12;

      // Título
      doc.setFontSize(18);
      doc.setDrawColor(220, 100, 0);
      doc.setFillColor(255, 240, 220);
      doc.rect(14, y - 8, 182, 10, 'F');
      doc.text('RELATÓRIO - FATURAMENTO', 14, y);
      y += 18;

      // Período
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      doc.setFontSize(11);
      doc.text(`Período: ${monthStart.toLocaleDateString('pt-BR')} a ${monthEnd.toLocaleDateString('pt-BR')}`, 14, y);
      y += 12;

      // Função auxiliar para criar tabelas simples
      const createTable = (title: string, rows: Array<[string, string]>, startY: number) => {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(title, 14, startY);

        let tableY = startY + 7;
        const colWidth = 85;

        // Cabeçalho
        doc.setFillColor(220, 220, 220);
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.rect(14, tableY - 5, colWidth, 6, 'F');
        doc.rect(14 + colWidth, tableY - 5, colWidth, 6, 'F');

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('Descrição', 16, tableY);
        doc.text('Valor', 14 + colWidth + 5, tableY);

        tableY += 8;

        // Linhas
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.3);
        doc.setFillColor(255, 255, 255);
        doc.setFontSize(9);

        rows.forEach((row) => {
          doc.rect(14, tableY - 5, colWidth, 6);
          doc.rect(14 + colWidth, tableY - 5, colWidth, 6);

          doc.text(row[0], 16, tableY, { maxWidth: colWidth - 4 });
          doc.text(row[1], 14 + colWidth + 5, tableY, { maxWidth: colWidth - 4, align: 'right' });
          tableY += 6;
        });

        return tableY + 4;
      };

      // Tabela 1: Identificação
      y = createTable('IDENTIFICAÇÃO', [
        ['ID da Máquina', `#${machineId}`],
        ['Localização', machine?.location || '-'],
        ['Endereço', machine?.address || '-'],
      ], y);

      y += 4;

      // Tabela 2: Resumo de Faturamento
      const totalMinutes = stats?.totalUsageMinutes ?? 0;
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;

      y = createTable('RESUMO DE FATURAMENTO', [
        ['Total de Acionamentos', `${stats?.totalActivations ?? 0}`],
        ['Tempo Total de Uso', `${totalHours}h ${remainingMinutes}m`],
        ['Total de Minutos', `${totalMinutes}`],
      ], y);

      y += 4;

      // Tabela 3: Cálculo de Repasse
      const minuteRate = 0.50;
      const totalAmount = totalMinutes * minuteRate;
      const apiracarPercentage = 0.30;
      const apiracarValue = totalAmount * apiracarPercentage;
      const yourValue = totalAmount * (1 - apiracarPercentage);

      y = createTable('CÁLCULO DE REPASSE FINANCEIRO', [
        ['Tarifa por Minuto', `R$ ${minuteRate.toFixed(2)}`],
        ['Valor Total', `R$ ${totalAmount.toFixed(2)}`],
        ['Valor APIRACAR (30%)', `R$ ${apiracarValue.toFixed(2)}`],
        ['Seu Repasse (70%)', `R$ ${yourValue.toFixed(2)}`],
      ], y);

      // ========== PÁGINAS 2+: HISTÓRICO DE ACIONAMENTOS ==========
      doc.addPage();
      y = 15;

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('HISTÓRICO DE RECEBIMENTOS', 14, y);
      y += 12;

      // Configuração da tabela de histórico
      const rowHeight = 7;
      const pageHeight = 280;
      const headerHeight = 8;
      const margin = 10;

      // Colunas: [label, width]
      const columns = [
        { label: 'Data/Hora', width: 35 },
        { label: 'Comando', width: 20 },
        { label: 'Duração', width: 20 },
        { label: 'Temperatura', width: 30 },
        { label: 'Status', width: 25 },
      ];

      const renderTableHeader = (startY: number) => {
        doc.setFillColor(220, 100, 0);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setLineWidth(0.5);
        doc.setDrawColor(220, 100, 0);

        let xPos = margin;
        columns.forEach((col) => {
          doc.rect(xPos, startY - 4, col.width, headerHeight, 'FD');
          doc.text(col.label, xPos + 2, startY + 1, { maxWidth: col.width - 4 });
          xPos += col.width;
        });
      };

      const renderTableRow = (rowData: string[], startY: number) => {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);

        let xPos = margin;
        columns.forEach((col, index) => {
          doc.rect(xPos, startY - 4, col.width, rowHeight);
          doc.text(rowData[index] || '-', xPos + 2, startY + 1, { maxWidth: col.width - 4 });
          xPos += col.width;
        });
      };

      // Render first header
      renderTableHeader(y);
      y += headerHeight + 2;

      // Render rows
      const rows = (history || []).slice(0, 500);
      rows.forEach((item, _index) => {
        // Verifica se precisa de nova página
        if (y + rowHeight > pageHeight) {
          doc.addPage();
          y = 15;
          renderTableHeader(y);
          y += headerHeight + 2;
        }

        const start = item.started_at
          ? new Date(item.started_at).toLocaleString('pt-BR', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          : '-';
        const cmd = item.command === 'on' ? 'Ligado' : item.command === 'off' ? 'Desligado' : item.command || '-';
        const dur = item.duration_minutes != null ? `${item.duration_minutes}m` : '-';
        const temp = item.average_temperature != null ? `${Number(item.average_temperature).toFixed(1)}°C` : '-';
        const st = item.status || '-';

        renderTableRow([start, cmd, dur, temp, st], y);
        y += rowHeight;
      });

      // Rodapé na última página
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 285);
      doc.text('UpCar Aspiradores - Sistema de Gestão', 120, 285);

      doc.save(`repasse_maquina_${machineId}_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF de repasse:', err);
      alert('Não foi possível gerar o PDF de repasse. Verifique se as dependências estão instaladas.');
    }
  };

  const handleDownloadHistoryData = async () => {
    if (activationHistory.length === 0) {
      alert('Nenhum dado de histórico para baixar. Filtre dados primeiro.');
      return;
    }

<<<<<<< HEAD
    try {
      const XLSX = await import('xlsx');
      
      // Preparar os dados
      const data = activationHistory.map((item) => {
        const activationWithMachine = item as ActivationHistoryWithMachine;
        const machineLocation = activationWithMachine.machines?.location || '-';
        const startDate = item.started_at ? new Date(item.started_at).toLocaleString('pt-BR') : '-';
        const cmd = item.command === 'on' ? 'Ligado' : item.command === 'off' ? 'Desligado' : item.command || '-';
        const dur = item.duration_minutes != null ? item.duration_minutes : '-';
        const temp = item.average_temperature != null ? item.average_temperature.toFixed(1) : '-';
        const status = item.status || '-';

        return {
          'ID': item.id,
          'Máquina ID': item.machine_id,
          'Localização': machineLocation,
          'Data/Hora Início': startDate,
          'Comando': cmd,
          'Duração (min)': dur,
          'Temperatura Média (°C)': temp,
          'Status': status
        };
      });

      // Criar workbook e adicionar worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Ajustar largura das colunas
      const columnWidths = [
        { wch: 10 },  // ID
        { wch: 12 },  // Máquina ID
        { wch: 20 },  // Localização
        { wch: 20 },  // Data/Hora
        { wch: 12 },  // Comando
        { wch: 14 },  // Duração
        { wch: 18 },  // Temperatura
        { wch: 12 }   // Status
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico');
      
      // Fazer download
      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `historico_acionamentos_${dateStr}.xlsx`);
    } catch (error) {
      console.error('Erro ao gerar arquivo Excel:', error);
      alert('Erro ao gerar arquivo Excel');
=======
    if (exportingHistory) {
      return;
    }

    setExportingHistory(true);
    try {
      const XLSX = await import('xlsx');
      const rows = buildHistoryRows(activationHistory);

      if (rows.length === 0) {
        alert('Nenhuma linha válida para exportar.');
        setExportingHistory(false);
        return;
      }

      const worksheetMatrix = buildWorksheetMatrix(revenueSummary, rows);
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetMatrix);
      worksheet['!cols'] = [
        { wch: 42 },
        { wch: 16 },
        { wch: 18 },
        { wch: 12 },
        { wch: 18 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');

      const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `historico_financeiro_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar planilha XLSX:', error);
      alert('Não foi possível gerar a planilha. Verifique os dados e tente novamente.');
    } finally {
      setExportingHistory(false);
>>>>>>> refs/remotes/origin/master
    }
  };

  const handleDownloadRepaymentReport = async () => {
    try {
      if (activationHistory.length === 0) {
        alert('Nenhum dado de histórico para gerar o PDF. Filtre dados primeiro.');
        return;
      }

      type JsPDFModule = {
        default?: {
          new(): JsPDFInstance;
        };
        new(): JsPDFInstance;
      };

      type JsPDFInstance = {
        setFontSize: (size: number) => void;
        setTextColor: (r: number, g?: number, b?: number) => void;
        text: (text: string, x: number, y: number, opts?: Record<string, unknown>) => void;
        setLineWidth: (width: number) => void;
        line: (x1: number, y1: number, x2: number, y2: number) => void;
        addPage: () => void;
        save: (filename: string) => void;
        setDrawColor: (r: number, g?: number, b?: number) => void;
        setFillColor: (r: number, g?: number, b?: number) => void;
        rect: (x: number, y: number, w: number, h: number, style?: string) => void;
        getTextWidth: (text: string) => number;
      };

      let jsPdfMod: JsPDFModule;
      try {
        jsPdfMod = (await import('jspdf') as unknown) as JsPDFModule;
      } catch {
        alert('Biblioteca jsPDF não encontrada. Execute: npm install jspdf');
        return;
      }

      const JsPDFClass = (jsPdfMod.default || jsPdfMod) as new () => JsPDFInstance;
      const doc = new JsPDFClass();

      // ========== PÁGINA 1: SUMÁRIO ==========
      let y = 15;

      // Cabeçalho com marca
      doc.setFontSize(16);
      doc.setTextColor(220, 100, 0);
      doc.text('AspiraCar connect', 14, y);
      doc.setTextColor(0, 0, 0);
      y += 12;

      // Título
      doc.setFontSize(18);
      doc.setDrawColor(220, 100, 0);
      doc.setFillColor(255, 240, 220);
      doc.rect(14, y - 8, 182, 10, 'F');
      doc.text('RELATÓRIO - FATURAMENTO CONSOLIDADO', 14, y);
      y += 18;

      // Período
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      doc.setFontSize(11);
      doc.text(`Período: ${monthStart.toLocaleDateString('pt-BR')} a ${monthEnd.toLocaleDateString('pt-BR')}`, 14, y);
      y += 12;

      // Calcular resumo consolidado
      const totalActivations = activationHistory.length;
      const totalMinutes = activationHistory.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      const minuteRate = 0.50;
      const totalAmount = totalMinutes * minuteRate;
      const apiracarValue = totalAmount * 0.30;
      const yourValue = totalAmount * 0.70;

      // Função auxiliar para criar tabelas
      const createTable = (title: string, rows: Array<[string, string]>, startY: number) => {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(title, 14, startY);

        let tableY = startY + 7;
        const colWidth = 85;

        // Cabeçalho
        doc.setFillColor(220, 220, 220);
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.rect(14, tableY - 5, colWidth, 6, 'F');
        doc.rect(14 + colWidth, tableY - 5, colWidth, 6, 'F');

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('Descrição', 16, tableY);
        doc.text('Valor', 14 + colWidth + 5, tableY);

        tableY += 8;

        // Linhas
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.3);
        doc.setFillColor(255, 255, 255);
        doc.setFontSize(9);

        rows.forEach((row) => {
          doc.rect(14, tableY - 5, colWidth, 6);
          doc.rect(14 + colWidth, tableY - 5, colWidth, 6);

          doc.text(row[0], 16, tableY, { maxWidth: colWidth - 4 });
          doc.text(row[1], 14 + colWidth + 5, tableY, { maxWidth: colWidth - 4, align: 'right' });
          tableY += 6;
        });

        return tableY + 4;
      };

      // Tabela: Resumo de Faturamento
      y = createTable('RESUMO DE FATURAMENTO', [
        ['Total de Acionamentos', `${totalActivations}`],
        ['Tempo Total de Uso', `${totalHours}h ${remainingMinutes}m`],
        ['Total de Minutos', `${totalMinutes}`],
      ], y);

      y += 4;

      // Tabela: Cálculo de Repasse
      y = createTable('CÁLCULO DE REPASSE FINANCEIRO', [
        ['Tarifa por Minuto', `R$ ${minuteRate.toFixed(2)}`],
        ['Valor Total', `R$ ${totalAmount.toFixed(2)}`],
        ['Valor APIRACAR (30%)', `R$ ${apiracarValue.toFixed(2)}`],
        ['Seu Repasse (70%)', `R$ ${yourValue.toFixed(2)}`],
      ], y);

      // ========== PÁGINAS 2+: HISTÓRICO DE ACIONAMENTOS ==========
      doc.addPage();
      y = 15;

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('HISTÓRICO DE RECEBIMENTOS', 14, y);
      y += 12;

      // Configuração da tabela de histórico
      const rowHeight = 7;
      const pageHeight = 280;
      const headerHeight = 8;
      const margin = 10;

      // Colunas
      const columns = [
        { label: 'Data/Hora', width: 35 },
        { label: 'Máquina', width: 15 },
        { label: 'Local', width: 25 },
        { label: 'Comando', width: 15 },
        { label: 'Duração', width: 20 },
        { label: 'Status', width: 30 },
      ];

      const renderTableHeader = (startY: number) => {
        doc.setFillColor(220, 100, 0);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setLineWidth(0.5);
        doc.setDrawColor(220, 100, 0);

        let xPos = margin;
        columns.forEach((col) => {
          doc.rect(xPos, startY - 4, col.width, headerHeight, 'FD');
          doc.text(col.label, xPos + 1, startY + 1, { maxWidth: col.width - 2 });
          xPos += col.width;
        });
      };

      const renderTableRow = (rowData: string[], startY: number) => {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);

        let xPos = margin;
        columns.forEach((col, index) => {
          doc.rect(xPos, startY - 4, col.width, rowHeight);
          doc.text(rowData[index] || '-', xPos + 1, startY + 1, { maxWidth: col.width - 2 });
          xPos += col.width;
        });
      };

      // Render first header
      renderTableHeader(y);
      y += headerHeight + 2;

      // Render rows
      activationHistory.forEach((item) => {
        // Verifica se precisa de nova página
        if (y + rowHeight > pageHeight) {
          doc.addPage();
          y = 15;
          renderTableHeader(y);
          y += headerHeight + 2;
        }

        const start = item.started_at
          ? new Date(item.started_at).toLocaleString('pt-BR', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          : '-';
        const machineData = item as ActivationHistoryWithMachine;
        const machineId = String(item.machine_id || '-');
        const location = machineData.machines?.location || '-';
        const cmd = item.command === 'on' ? 'Ligado' : item.command === 'off' ? 'Desligado' : item.command || '-';
        const dur = item.duration_minutes != null ? `${item.duration_minutes}m` : '-';
        const st = item.status || '-';

        renderTableRow([start, machineId, location, cmd, dur, st], y);
        y += rowHeight;
      });

      // Rodapé na última página
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 285);
      doc.text('UpCar Aspiradores - Sistema de Gestão', 120, 285);

      doc.save(`repasse_consolidado_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF de repasse consolidado:', err);
      alert('Não foi possível gerar o PDF. Verifique se as dependências estão instaladas.');
    }
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
            const userId = clientId.trim();

            // Chamar a API route para incrementar saldo (bypass RLS)
            const addBalanceResponse = await fetch('/api/machine/add-balance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                amount: amountValue
              })
            });

            if (!addBalanceResponse.ok) {
              const errorData = await addBalanceResponse.json();
              alert(`Erro ao incrementar saldo: ${errorData.error}`);
              return;
            }

            const description = clientName
              ? `Crédito adicionado para ${clientName}`
              : `Crédito adicionado - Cliente ID: ${clientId}`;

            // Criar transação para registro
            const { error } = await createTransaction({
              user_id: userId || undefined,
              amount: amountValue,
              type: 'entrada',
              description: description,
              payment_method: paymentMethod,
            });

            if (error) {
              alert(`Erro ao registrar transação: ${error.message}`);
            } else {
              alert(`Crédito de R$ ${amountValue.toFixed(2)} adicionado com sucesso para ${clientName || clientId}!`);
              // Limpar formulário
              setClientId('');
              setClientName('');
              setAmount('');
              setPaymentMethod('');
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
              <h2 className="text-3xl font-bold text-gray-900">Faturamento e Repasse</h2>
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
                {/* Cards de resumo financeiro */}
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

                {/* RESUMO DE USO - Tabela com minutagem por equipamento */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Resumo de Uso por Equipamento</h3>
                  {machines.length === 0 ? (
                    <p className="text-gray-500">Nenhum equipamento cadastrado</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Localização</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-700">Acionamentos</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-700">Tempo Total</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-700">Repasse (70%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {machines.map((machine) => {
                            const stats = machineStats[machine.id];
                            const totalMinutes = stats?.totalUsageMinutes ?? 0;
                            const totalHours = Math.floor(totalMinutes / 60);
                            const remainingMinutes = totalMinutes % 60;
                            const minuteRate = 0.50;
                            const totalAmount = totalMinutes * minuteRate;
                            const repaymentValue = totalAmount * 0.70;

                            return (
                              <tr key={machine.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-semibold text-gray-900">#{machine.id}</td>
                                <td className="px-4 py-3 text-gray-700">{machine.location || '-'}</td>
                                <td className="px-4 py-3 text-center text-gray-700">{stats?.totalActivations ?? 0}</td>
                                <td className="px-4 py-3 text-center text-gray-700">{totalHours}h {remainingMinutes}m</td>
                                <td className="px-4 py-3 text-right font-semibold text-green-600">R$ {repaymentValue.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                <p className="text-gray-400 text-sm mt-2">Verifique se a tabela &apos;transactions&apos; foi criada no Supabase.</p>
              </div>
            )}
          </>
        );

      case 'historico_acionamentos':
        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Histórico de Acionamentos</h2>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-end md:space-x-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data início</label>
                  <input type="date" value={historyStart} onChange={(e) => setHistoryStart(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data fim</label>
                  <input type="date" value={historyEnd} onChange={(e) => setHistoryEnd(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadHistoryData}
<<<<<<< HEAD
                    disabled={activationHistory.length === 0}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium"
                  >
                    📊 Baixar Excel
=======
                    disabled={activationHistory.length === 0 || exportingHistory}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium"
                  >
                    {exportingHistory ? 'Gerando...' : '⬇️ Baixar XLSX'}
>>>>>>> refs/remotes/origin/master
                  </button>
                  <button
                    onClick={handleDownloadRepaymentReport}
                    disabled={activationHistory.length === 0}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium"
                  >
                    📄 Baixar PDF Repasse
                  </button>
                </div>
              </div>
            </div>
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

        // Debug: log quando a view de equipamentos é renderizada
        if (machines.length > 0) {
          console.log('Renderizando view equipamentos com', totalMachines, 'máquinas:', machines.map(m => ({ id: m.id, location: m.location })));
        }

        const toggleExpand = (id: number) => setExpandedMachines(prev => ({ ...prev, [id]: !prev[id] }));

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
                    <p className="font-semibold mb-2">Nenhuma máquina encontrada.</p>
                    <p className="text-sm mb-4">Verifique:</p>
                    <ul className="text-sm text-left max-w-md mx-auto space-y-1">
                      <li>• Se a tabela &quot;machines&quot; existe no Supabase</li>
                      <li>• Se as políticas RLS (Row Level Security) permitem leitura</li>
                      <li>• Se há máquinas cadastradas no banco de dados</li>
                      <li>• Abra o console do navegador (F12) para ver erros detalhados</li>
                    </ul>
                    <p className="mt-4 text-sm">Use a opção &quot;Adicionar Máquina&quot; no menu para cadastrar.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadastrada em</th>
                        <th className="px-6 py-3" />
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

                        const stats = machineStats[machine.id];

                        return (
                          <>
                            <tr key={machine.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{machine.id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{machine.location || 'Não especificada'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                                  {statusText}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{createdAt}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <button onClick={() => toggleExpand(machine.id)} className="text-orange-600 hover:text-orange-800">
                                  {expandedMachines[machine.id] ? 'Fechar' : 'Detalhes'}
                                </button>
                              </td>
                            </tr>
                            {expandedMachines[machine.id] && (
                              <tr>
                                <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                                      <p className="text-sm text-gray-500">Voltagem</p>
                                      <p className="text-lg font-semibold text-gray-900">{stats?.voltage ?? '-'}</p>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                                      <p className="text-sm text-gray-500">Última limpeza</p>
                                      <p className="text-lg font-semibold text-gray-900">{stats?.last_cleaning ? new Date(stats.last_cleaning).toLocaleDateString('pt-BR') : '-'}</p>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                                      <p className="text-sm text-gray-500">Total de acionamentos</p>
                                      <p className="text-lg font-semibold text-gray-900">{stats?.totalActivations ?? 0}</p>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                                      <p className="text-sm text-gray-500">Tempo total de uso</p>
                                      <p className="text-lg font-semibold text-gray-900">{stats?.totalUsageMinutes ?? 0} min</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
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

      case 'historico_caixa':
        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Histórico do Caixa</h2>
            <CashHistoryPage />
          </>
        );

      case 'importar_excel':
        return (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Importar Dados Excel</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">1️⃣ Gerar Planilha Modelo</h3>
                <ExcelTemplateGenerator />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">2️⃣ Importar Planilha Preenchida</h3>
                <ExcelUploader />
              </div>
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
