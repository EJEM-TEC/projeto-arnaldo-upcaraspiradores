'use client'

/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface CashTransaction {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  created_at: string;
  added_by: string; // Email ou nome do admin que adicionou
  notes?: string;
}

interface CashHistoryPageProps {
  startDate?: string;
  endDate?: string;
}

export default function CashHistoryPage({ startDate = '', endDate = '' }: CashHistoryPageProps) {
  const [filterStartDate, setFilterStartDate] = useState(startDate);
  const [filterEndDate, setFilterEndDate] = useState(endDate);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtering, setFiltering] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadCashHistory();
  }, []);

  const loadCashHistory = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('type', 'cash_credit')
        .order('created_at', { ascending: false });

      if (start) {
        query = query.gte('created_at', new Date(start).toISOString());
      }
      if (end) {
        query = query.lte('created_at', new Date(new Date(end).setHours(23, 59, 59, 999)).toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar histórico do caixa:', error);
        alert('Erro ao carregar dados: ' + error.message);
      } else {
        setTransactions(data || []);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      alert('Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    setFiltering(true);
    await loadCashHistory(filterStartDate, filterEndDate);
    setFiltering(false);
  };

  const downloadCSV = () => {
    if (transactions.length === 0) {
      alert('Nenhum dado para download');
      return;
    }

    const headers = ['Usuário', 'Data', 'Horário', 'Valor', 'Adicionado por'];
    const rows = transactions.map(t => {
      const date = new Date(t.created_at);
      return [
        t.user_name,
        date.toLocaleDateString('pt-BR'),
        date.toLocaleTimeString('pt-BR'),
        `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        t.added_by
      ];
    });

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_caixa_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const downloadRepaymentPDF = async () => {
    if (transactions.length === 0) {
      alert('Nenhum dado para gerar relatório');
      return;
    }

    try {
      // Importar jsPDF dinamicamente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let jsPdfMod: any;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jsPdfMod = (await import('jspdf') as any);
      } catch {
        alert('Erro ao carregar biblioteca de PDF');
        return;
      }

      const jsPDF = jsPdfMod.jsPDF || jsPdfMod.default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = new jsPDF() as any;
      
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      let yPosition = margin;

      // Título
      doc.setFontSize(16);
      doc.text('RELATÓRIO DE REPASSE', margin, yPosition);
      yPosition += 10;

      // Período
      doc.setFontSize(11);
      const period = filterStartDate && filterEndDate
        ? `Período: ${new Date(filterStartDate).toLocaleDateString('pt-BR')} a ${new Date(filterEndDate).toLocaleDateString('pt-BR')}`
        : 'Período: Todos os registros';
      doc.text(period, margin, yPosition);
      yPosition += 10;

      // Cabeçalho da tabela
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      
      const colWidth = [(pageWidth - 2 * margin) * 0.25, (pageWidth - 2 * margin) * 0.15, (pageWidth - 2 * margin) * 0.15, (pageWidth - 2 * margin) * 0.15, (pageWidth - 2 * margin) * 0.3];
      const colNames = ['Usuário', 'Data', 'Horário', 'Valor', 'Adicionado por'];
      
      let xPos = margin;
      doc.setDrawColor(220, 100, 0);
      doc.setFillColor(220, 100, 0);
      doc.setTextColor(255, 255, 255);
      
      colNames.forEach((name, i) => {
        doc.rect(xPos, yPosition, colWidth[i], 8, 'FD');
        doc.text(name, xPos + 2, yPosition + 5, { maxWidth: colWidth[i] - 4 });
        xPos += colWidth[i];
      });
      
      yPosition += 10;

      // Linhas da tabela
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      const rowHeight = 8;
      
      transactions.forEach((t) => {
        if (yPosition > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
          
          // Repetir cabeçalho na nova página
          xPos = margin;
          doc.setDrawColor(220, 100, 0);
          doc.setFillColor(220, 100, 0);
          doc.setTextColor(255, 255, 255);
          doc.setFont(undefined, 'bold');
          
          colNames.forEach((name, i) => {
            doc.rect(xPos, yPosition, colWidth[i], 8, 'FD');
            doc.text(name, xPos + 2, yPosition + 5, { maxWidth: colWidth[i] - 4 });
            xPos += colWidth[i];
          });
          
          yPosition += 10;
          doc.setFont(undefined, 'normal');
          doc.setTextColor(0, 0, 0);
        }

        const date = new Date(t.created_at);
        const rowData = [
          t.user_name,
          date.toLocaleDateString('pt-BR'),
          date.toLocaleTimeString('pt-BR'),
          `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          t.added_by
        ];

        doc.setDrawColor(150, 150, 150);
        xPos = margin;
        
        rowData.forEach((data, i) => {
          doc.rect(xPos, yPosition, colWidth[i], rowHeight);
          doc.text(data, xPos + 2, yPosition + 4, { maxWidth: colWidth[i] - 4 });
          xPos += colWidth[i];
        });
        
        yPosition += rowHeight;
      });

      // Resumo
      yPosition += 10;
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`Total de transações: ${transactions.length}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Valor total: R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPosition);

      // Salvar PDF
      const filename = `repasse_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar relatório PDF');
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Inicial
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Final
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFilter}
            disabled={filtering}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {filtering ? 'Filtrando...' : 'FILTRAR DADOS'}
          </button>
          <button
            onClick={downloadCSV}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📊 BAIXAR CSV
          </button>
          <button
            onClick={downloadRepaymentPDF}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            📄 REPASSE
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Usuário</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Dia</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Horário</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Valor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Adicionado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const date = new Date(transaction.created_at);
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-sm text-gray-900">{transaction.user_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {date.toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {date.toLocaleTimeString('pt-BR')}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-green-600">
                        R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">{transaction.added_by}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Total de Transações</p>
            <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Valor Total</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {transactions
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Ticket Médio</p>
            <p className="text-2xl font-bold text-orange-600">
              R$ {(transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
