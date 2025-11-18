'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function ExcelTemplateGenerator() {
  const [loading, setLoading] = useState(false);

  const generateExcelTemplate = () => {
    try {
      setLoading(true);

      // Criar workbook
      const workbook = XLSX.utils.book_new();

      // ===== WORKSHEET 1: DADOS =====
      // Combinar: 4 linhas de resumo + 1 linha em branco + cabeçalho + dados
      const combinedData = [
        // Resumo (linhas 1-4)
        ['Receita POSTO', 0],
        ['Receita APP', 0],
        ['Receita PIX', 0],
        ['Receita CARTÃO', 0],
        [], // Linha em branco (linha 5)
        // Cabeçalho da tabela (linha 6)
        ['Equipamento', 'Tempo em min', 'Valor por aspira', 'Quantidade', 'Valor Total'],
        // Dados da tabela (a partir de linha 7) - com fórmulas
        ['Exemplo: Aspirador 1', 120, 5.00, 10, '=C7*D7'],
        ['Exemplo: Aspirador 2', 90, 3.00, 5, '=C8*D8'],
        // Linhas em branco para preenchimento
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
      ];

      // Criar worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(combinedData);

      // Configurar larguras de coluna
      worksheet['!cols'] = [
        { wch: 25 }, // Receita / Equipamento
        { wch: 15 }, // Valor / Tempo
        { wch: 18 }, // Valor por aspira
        { wch: 12 }, // Quantidade
        { wch: 18 }, // Saldo utilizado
      ];

      // Formatar células do resumo (linhas 1-4)
      const summaryStyle = {
        font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'FF6B35' } }, // Laranja
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };

      const summaryValueStyle = {
        font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'FF6B35' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        numFmt: '0.00',
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };

      // Aplicar estilos ao resumo
      for (let i = 0; i < 4; i++) {
        const cell1 = XLSX.utils.encode_cell({ r: i, c: 0 });
        const cell2 = XLSX.utils.encode_cell({ r: i, c: 1 });
        worksheet[cell1].s = summaryStyle;
        worksheet[cell2].s = summaryValueStyle;
      }

      // Formatar cabeçalho da tabela (linha 6)
      const headerStyle = {
        font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '004B87' } }, // Azul escuro
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };

      for (let c = 0; c < 5; c++) {
        const cell = XLSX.utils.encode_cell({ r: 5, c });
        worksheet[cell].s = headerStyle;
      }

      // Formatar dados da tabela (linhas 7+)
      const dataStyle = {
        font: { size: 10, color: { rgb: '000000' } },
        fill: { fgColor: { rgb: 'E8F4F8' } }, // Azul claro
        alignment: { horizontal: 'left', vertical: 'center' },
        numFmt: '0.00',
        border: {
          top: { style: 'thin', color: { rgb: 'CCCCCC' } },
          bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
          left: { style: 'thin', color: { rgb: 'CCCCCC' } },
          right: { style: 'thin', color: { rgb: 'CCCCCC' } },
        },
      };

      const dataCenterStyle = {
        ...dataStyle,
        alignment: { horizontal: 'center', vertical: 'center' },
      };

      for (let r = 6; r < 8; r++) {
        for (let c = 0; c < 5; c++) {
          const cell = XLSX.utils.encode_cell({ r, c });
          worksheet[cell].s = c === 0 ? dataStyle : dataCenterStyle;
        }
      }

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Importação');

      // ===== WORKSHEET 2: INSTRUÇÕES =====
      const instructionsData = [
        ['INSTRUÇÕES DE PREENCHIMENTO'],
        [],
        ['RESUMO FINANCEIRO (Linhas 1-4):'],
        ['Célula', 'Descrição'],
        ['A1', 'Rótulo "Receita POSTO" (não altere)'],
        ['B1', 'Valor total de receita do POSTO em reais'],
        ['A2', 'Rótulo "Receita APP" (não altere)'],
        ['B2', 'Valor total de receita do APP em reais'],
        ['A3', 'Rótulo "Receita PIX" (não altere)'],
        ['B3', 'Valor total de receita do PIX em reais'],
        ['A4', 'Rótulo "Receita CARTÃO" (não altere)'],
        ['B4', 'Valor total de receita do CARTÃO em reais'],
        [],
        ['TABELA DE EQUIPAMENTOS (Linhas 6+):'],
        ['Coluna', 'Descrição', 'Exemplo'],
        ['A', 'Equipamento', 'Aspirador 1, Máquina 2, etc'],
        ['B', 'Tempo em min', '120'],
        ['C', 'Valor por aspira', '5.00'],
        ['D', 'Quantidade', '10'],
        ['E', 'Saldo utilizado', '50.00 (será calculado como C×D)'],
        [],
        ['NOTAS:'],
        ['- Use números com ponto decimal (ex: 5.00 ou 100.50)'],
        ['- Não altere os rótulos do resumo (Receita POSTO, APP, PIX, CARTÃO)'],
        ['- Adicione quantas linhas precisar na tabela'],
        ['- Os valores serão salvos no banco de dados automaticamente'],
      ];

      const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
      instructionsSheet['!cols'] = [
        { wch: 20 },
        { wch: 40 },
        { wch: 30 },
      ];

      XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instruções');

      // Salvar arquivo
      const fileName = `Planilha_Importacao_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      alert('✅ Planilha modelo gerada com sucesso! Arquivo: ' + fileName);
    } catch (error) {
      console.error('Erro ao gerar planilha:', error);
      alert('❌ Erro ao gerar planilha: ' + (error instanceof Error ? error.message : 'Desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">📋 Gerador de Planilha Excel</h2>
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Como usar:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li><strong>Clique no botão abaixo</strong> para gerar a planilha modelo</li>
          <li><strong>Abra o arquivo</strong> no Excel, Google Sheets ou LibreOffice</li>
          <li><strong>Preencha os valores</strong> seguindo as instruções (Aba &quot;Instruções&quot;)</li>
          <li><strong>Salve o arquivo</strong></li>
          <li><strong>Use a aba &quot;Upload&quot; </strong> para importar o arquivo preenchido</li>
        </ol>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Importante:</strong> A planilha contém formatação automática. Não altere os rótulos do resumo 
          (Receita POSTO, APP, PIX, CARTÃO) nem a estrutura da tabela. Apenas preencha os valores.
        </p>
      </div>

      <button
        onClick={generateExcelTemplate}
        disabled={loading}
        className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition disabled:cursor-not-allowed"
      >
        {loading ? '⏳ Gerando...' : '📥 Gerar Planilha Excel'}
      </button>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">📊 O que a planilha contém:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ <strong>Aba &quot;Importação&quot;:</strong> Planilha pronta para preenchimento com exemplos</li>
          <li>✓ <strong>Aba &quot;Instruções&quot;:</strong> Guia completo de preenchimento</li>
          <li>✓ <strong>Formatação:</strong> Cores, bordas e estilos para facilitar visualização</li>
          <li>✓ <strong>Validação:</strong> Estrutura fixa para garantir compatibilidade</li>
        </ul>
      </div>
    </div>
  );
}
