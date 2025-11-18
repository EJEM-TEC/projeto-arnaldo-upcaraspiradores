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
  valorTotal: number;
}

interface ExcelData {
  summary: SummaryData;
  tableData: TableRow[];
}

export default function ExcelUploader() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const extractCellValue = (cell: unknown): number | string => {
    if (!cell) return '';
    const cellObj = cell as Record<string, unknown>;
    if (cellObj.v !== undefined && cellObj.v !== null) {
      return cellObj.v as number | string;
    }
    return '';
  };

  const processExcelFile = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellFormula: true,
        cellStyles: true
      });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      console.log('Processando planilha Excel...');

      // EXTRAIR RESUMO (linhas 1-4, coluna B)
      const summary: SummaryData = {
        receitaPosto: Number(extractCellValue(worksheet['B1'])) || 0,
        receitaApp: Number(extractCellValue(worksheet['B2'])) || 0,
        receitaPix: Number(extractCellValue(worksheet['B3'])) || 0,
        receitaCartao: Number(extractCellValue(worksheet['B4'])) || 0,
        totalReceita: 0,
      };

      // Calcular total de receita
      summary.totalReceita = summary.receitaPosto + summary.receitaApp + summary.receitaPix + summary.receitaCartao;

      console.log('Resumo extraído:', summary);

      // EXTRAIR TABELA (a partir da linha 7)
      const tableData: TableRow[] = [];
      let rowIndex = 7;

      while (true) {
        const equipamentoCell = XLSX.utils.encode_cell({ r: rowIndex - 1, c: 0 });
        const tempoCell = XLSX.utils.encode_cell({ r: rowIndex - 1, c: 1 });
        const valorCell = XLSX.utils.encode_cell({ r: rowIndex - 1, c: 2 });
        const qtdCell = XLSX.utils.encode_cell({ r: rowIndex - 1, c: 3 });

        const equipamento = String(extractCellValue(worksheet[equipamentoCell])).trim();

        if (!equipamento || equipamento === '') {
          break;
        }

        const tempoEmMin = Number(extractCellValue(worksheet[tempoCell])) || 0;
        const valorPorAspira = Number(extractCellValue(worksheet[valorCell])) || 0;
        const quantidade = Number(extractCellValue(worksheet[qtdCell])) || 0;

        // CALCULAR valor total
        const valorTotal = Math.round(valorPorAspira * quantidade * 100) / 100;

        tableData.push({
          equipamento,
          tempoEmMin,
          valorPorAspira,
          quantidade,
          valorTotal,
        });

        rowIndex++;

        if (rowIndex > 107) break;
      }

      console.log('Tabela extraída:', tableData);

      if (tableData.length === 0) {
        throw new Error('Nenhuma linha de equipamento foi encontrada na planilha. Verifique o formato.');
      }

      setExcelData({
        summary,
        tableData,
      });
    } catch (error) {
      console.error('Erro ao processar Excel:', error);
      setError(error instanceof Error ? error.message : 'Erro ao processar arquivo');
      setExcelData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx')) {
        setError('Apenas arquivos .xlsx são suportados');
        return;
      }
      processExcelFile(file);
    }
  };

  const handleSaveToDB = async () => {
    if (!excelData) return;

    try {
      setUploadLoading(true);
      const response = await fetch('/api/excel/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(excelData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar dados');
      }

      alert(`✅ Dados importados com sucesso! ${result.rowsCount} linhas salvas.`);
      setExcelData(null);
      const input = document.getElementById('excel-upload') as HTMLInputElement;
      if (input) input.value = '';
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao salvar dados');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">📤 Upload Planilha Preenchida</h2>
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <label className="block mb-4">
          <span className="text-lg font-semibold text-gray-800 mb-2 block">Selecione o arquivo Excel:</span>
          <input
            type="file"
            id="excel-upload"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={loading}
            className="w-full px-4 py-3 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">❌ Erro:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">⏳ Processando arquivo...</p>
          </div>
        )}
      </div>

      {excelData && (
        <div className="space-y-6">
          {/* RESUMO */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-300">
            <h3 className="text-xl font-bold text-orange-900 mb-4">📊 RESUMO FINANCEIRO</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-600">Receita POSTO</p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {excelData.summary.receitaPosto.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-600">Receita APP</p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {excelData.summary.receitaApp.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-600">Receita PIX</p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {excelData.summary.receitaPix.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-600">Receita CARTÃO</p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {excelData.summary.receitaCartao.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-orange-300 flex justify-between items-center">
              <p className="text-lg font-bold text-orange-900">Total de Receita</p>
              <p className="text-3xl font-bold text-orange-700">
                R$ {excelData.summary.totalReceita.toFixed(2)}
              </p>
            </div>
          </div>

          {/* TABELA */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <h3 className="text-xl font-bold text-gray-900 p-6 pb-4 border-b border-gray-200">
              📋 EQUIPAMENTOS ({excelData.tableData.length} linhas)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Equipamento</th>
                    <th className="px-4 py-3 text-center font-semibold">Tempo (min)</th>
                    <th className="px-4 py-3 text-right font-semibold">Valor/Aspira</th>
                    <th className="px-4 py-3 text-center font-semibold">Quantidade</th>
                    <th className="px-4 py-3 text-right font-semibold">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {excelData.tableData.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-gray-900 font-medium">{row.equipamento}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{row.tempoEmMin}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        R$ {row.valorPorAspira.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">{row.quantidade}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        R$ {row.valorTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTÃO SALVAR */}
          <button
            onClick={handleSaveToDB}
            disabled={uploadLoading}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition disabled:cursor-not-allowed"
          >
            {uploadLoading ? '⏳ Salvando...' : '💾 Salvar no Banco de Dados'}
          </button>
        </div>
      )}

      {!excelData && !loading && (
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 text-center">
          <p className="text-blue-900 font-semibold text-lg">
            📁 Selecione uma planilha Excel preenchida para começar
          </p>
        </div>
      )}
    </div>
  );
}
