import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

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

interface RequestBody {
  summary: SummaryData;
  tableData: TableRow[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { summary, tableData } = body;

    if (!summary || !tableData) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // 1. Criar registro na tabela excel_imports (resumo)
    const { data: importData, error: importError } = await supabaseServer
      .from('excel_imports')
      .insert({
        receita_posto: summary.receitaPosto,
        receita_app: summary.receitaApp,
        receita_pix: summary.receitaPix,
        receita_cartao: summary.receitaCartao,
        total_receita: summary.totalReceita,
        imported_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (importError) {
      console.error('Error inserting import record:', importError);
      return NextResponse.json(
        { error: 'Erro ao salvar resumo: ' + importError.message },
        { status: 500 }
      );
    }

    console.log('Import record created:', importData);

    // 2. Inserir dados da tabela
    const importId = importData.id;
    const rowsToInsert = tableData.map((row) => ({
      import_id: importId,
      equipamento: row.equipamento,
      tempo_em_min: row.tempoEmMin,
      valor_por_aspira: row.valorPorAspira,
      quantidade: row.quantidade,
      saldo_utilizado: row.valorTotal, // Usar valorTotal (já calculado no frontend)
      valor_total: row.valorTotal,
      created_at: new Date().toISOString(),
    }));

    const { error: rowsError } = await supabaseServer
      .from('excel_import_rows')
      .insert(rowsToInsert);

    if (rowsError) {
      console.error('Error inserting rows:', rowsError);
      return NextResponse.json(
        { error: 'Erro ao salvar linhas: ' + rowsError.message },
        { status: 500 }
      );
    }

    console.log(`Inserted ${rowsToInsert.length} rows`);

    return NextResponse.json(
      {
        success: true,
        message: `Dados importados com sucesso! ${rowsToInsert.length} equipamentos salvos.`,
        importId,
        rowsCount: rowsToInsert.length,
        summary,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in excel import:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
