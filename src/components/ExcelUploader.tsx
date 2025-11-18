'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

interface SummaryData {
  receitaPosto: number;
  receitaApp: number;
  receitaPix: number;
  receitaCartao: number;
  totalReceita: number;
}

interface TableRow {
  equipamento: string;
  tempoEmMin: number;
  valorPorAspira: number;
  quantidade: number;
  saldoUtilizado: number;
}

interface ExcelData {
  summary: SummaryData;
  tableData: TableRow[];
  rawData: unknown[];
}

export default function ExcelUploader() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processExcelFile = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      // Ler o arquivo
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Extrair dados brutos
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '',
        blankrows: false 
      });

      console.log('Raw data from Excel:', rawData);

      // ===== EXTRAIR RESUMO (CABEÇALHO) =====
      // Procura pelas células com 'Receita POSTO', 'Receita APP', etc
      const summary: SummaryData = {
        receitaPosto: 0,
        receitaApp: 0,
        receitaPix: 0,
        receitaCartao: 0,
        totalReceita: 0,
      };

      // Método 1: Varrer as primeiras linhas procurando pelos rótulos
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i] as Record<string, unknown>;
        
        // Procura por chaves/valores que contenham os rótulos
        Object.entries(row).forEach(([key, value]) => {
          const cellValue = String(value).toLowerCase().trim();
          const nextKey = Object.keys(row)[Object.keys(row).indexOf(key) + 1];
          const nextValue = nextKey ? Number(row[nextKey]) || 0 : 0;

          if (cellValue.includes('receita') && cellValue.includes('posto')) {
            summary.receitaPosto = nextValue;
          } else if (cellValue.includes('receita') && cellValue.includes('app')) {
            summary.receitaApp = nextValue;
          } else if (cellValue.includes('receita') && cellValue.includes('pix')) {
            summary.receitaPix = nextValue;
          } else if (cellValue.includes('receita') && cellValue.includes('cartão')) {
            summary.receitaCartao = nextValue;
          }
        });
      }

      summary.totalReceita = 
        summary.receitaPosto + 
        summary.receitaApp + 
        summary.receitaPix + 
        summary.receitaCartao;

      console.log('Extracted summary:', summary);

      // ===== EXTRAIR TABELA DE HISTÓRICO =====
      // Procura pela linha que contém os cabeçalhos da tabela
      let tableStartIndex = -1;

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i] as Record<string, unknown>;
        const rowKeys = Object.keys(row).map(k => String(k).toLowerCase().trim());
        const rowValues = Object.values(row).map(v => String(v).toLowerCase().trim());

        // Verifica se alguma coluna contém "equipamento"
        if (rowKeys.some(k => k.includes('equipamento')) || rowValues.some(v => v.includes('equipamento'))) {
          tableStartIndex = i;
          break;
        }
      }

      console.log('Table start index:', tableStartIndex);

      // Se encontrou a tabela, extrai os dados
      let tableData: TableRow[] = [];
      if (tableStartIndex >= 0) {
        // Pega os dados a partir da linha depois do cabeçalho
        const tableRows = rawData.slice(tableStartIndex + 1);

        tableData = tableRows
          .map((row: unknown) => {
            const rowData = row as Record<string, unknown>;
            
            // Encontra as colunas relevantes (independente do nome exato)
            const keys = Object.keys(rowData);
            let equipamento = '';
            let tempoEmMin = 0;
            let valorPorAspira = 0;
            let quantidade = 0;
            let saldoUtilizado = 0;

            // Mapeia as colunas
            keys.forEach((key, index) => {
              const keyLower = String(key).toLowerCase();
              const value = rowData[key];

              if (keyLower.includes('equipamento')) {
                equipamento = String(value);
              } else if (keyLower.includes('tempo') && keyLower.includes('min')) {
                tempoEmMin = Number(value) || 0;
              } else if (keyLower.includes('valor') && keyLower.includes('aspira')) {
                valorPorAspira = Number(value) || 0;
              } else if (keyLower.includes('quantidade')) {
                quantidade = Number(value) || 0;
              } else if (keyLower.includes('saldo') && keyLower.includes('utilizado')) {
                saldoUtilizado = Number(value) || 0;
              }
              
              // Fallback: se for a coluna 1, 2, 3, 4, 5
              if (index === 0) equipamento = equipamento || String(value);
              if (index === 1) tempoEmMin = tempoEmMin || Number(value) || 0;
              if (index === 2) valorPorAspira = valorPorAspira || Number(value) || 0;
              if (index === 3) quantidade = quantidade || Number(value) || 0;
              if (index === 4) saldoUtilizado = saldoUtilizado || Number(value) || 0;
            });

            // Valida se há dados na linha
            if (equipamento || tempoEmMin || quantidade) {
              return {
                equipamento,
                tempoEmMin,
                valorPorAspira,
                quantidade,
                saldoUtilizado,
              };
            }
            return null;
          })
          .filter((row): row is TableRow => row !== null && row.equipamento.trim() !== '');
      }

      console.log('Extracted table data:', tableData);

      const result: ExcelData = {
        summary,
        tableData,
        rawData,
      };

      setExcelData(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido ao processar arquivo';
      setError(errorMsg);
      console.error('Error processing Excel:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
        return;
      }
      processExcelFile(file);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!excelData) {
      setError('Nenhum dado para salvar');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/excel/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(excelData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar dados');
      }

      alert('Dados salvos com sucesso!');
      setExcelData(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar dados';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Importar Dados Excel</h2>

      {/* Input file */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione arquivo Excel (.xlsx)
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Erro */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">⏳ Processando arquivo...</p>
        </div>
      )}

      {/* Dados Extraídos */}
      {excelData && (
        <div className="space-y-6">
          {/* Resumo */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Resumo Financeiro</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-3 rounded border border-green-100">
                <p className="text-xs text-gray-600">Receita POSTO</p>
                <p className="text-lg font-bold text-green-600">
                  R$ {excelData.summary.receitaPosto.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-100">
                <p className="text-xs text-gray-600">Receita APP</p>
                <p className="text-lg font-bold text-blue-600">
                  R$ {excelData.summary.receitaApp.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-purple-100">
                <p className="text-xs text-gray-600">Receita PIX</p>
                <p className="text-lg font-bold text-purple-600">
                  R$ {excelData.summary.receitaPix.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-orange-100">
                <p className="text-xs text-gray-600">Receita CARTÃO</p>
                <p className="text-lg font-bold text-orange-600">
                  R$ {excelData.summary.receitaCartao.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-3 rounded border-2 border-green-400">
                <p className="text-xs text-gray-600 font-semibold">Total</p>
                <p className="text-lg font-bold text-green-700">
                  R$ {excelData.summary.totalReceita.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de Histórico */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Dados de Equipamentos ({excelData.tableData.length} linhas)
            </h3>
            {excelData.tableData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-200 text-gray-900">
                      <th className="px-4 py-2 text-left">Equipamento</th>
                      <th className="px-4 py-2 text-right">Tempo (min)</th>
                      <th className="px-4 py-2 text-right">Valor/Aspira</th>
                      <th className="px-4 py-2 text-right">Quantidade</th>
                      <th className="px-4 py-2 text-right">Saldo Utilizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelData.tableData.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-300 hover:bg-gray-100">
                        <td className="px-4 py-2">{row.equipamento}</td>
                        <td className="px-4 py-2 text-right">{row.tempoEmMin}</td>
                        <td className="px-4 py-2 text-right">
                          R$ {row.valorPorAspira.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">{row.quantidade}</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          R$ {row.saldoUtilizado.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum dado de equipamento encontrado</p>
            )}
          </div>

          {/* Botão Salvar */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveToDatabase}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
            >
              💾 Salvar no Banco de Dados
            </button>
            <button
              onClick={() => {
                setExcelData(null);
                setError(null);
              }}
              disabled={loading}
              className="px-4 py-3 bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
            >
              ❌ Limpar
            </button>
          </div>

          {/* JSON Raw */}
          <details className="bg-gray-50 p-4 rounded border border-gray-200">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              📄 Ver dados brutos (JSON)
            </summary>
            <pre className="mt-3 p-3 bg-gray-900 text-green-400 rounded overflow-x-auto text-xs">
              {JSON.stringify({ summary: excelData.summary, tableData: excelData.tableData }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
