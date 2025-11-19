import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { 
  setMachineCommand,
  updateActivationHistory,
  getActivationHistoryByMachine,
  ActivationHistory
} from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { machineId, machineSlug } = body;

    if (!machineId && !machineSlug) {
      return NextResponse.json(
        { error: 'Missing required field: machineId or machineSlug' },
        { status: 400 }
      );
    }

    // Se tem slug, busca o ID da máquina
    let actualMachineId = machineId;
    if (machineSlug && !machineId) {
      const { data: machineData, error: machineError } = await supabase
        .from('machines')
        .select('id')
        .eq('slug_id', machineSlug)
        .maybeSingle();
      
      if (machineError || !machineData) {
        console.error('[DEACTIVATE] Error finding machine by slug:', machineError);
        return NextResponse.json(
          { error: 'Máquina não encontrada' },
          { status: 404 }
        );
      }
      actualMachineId = machineData.id;
    }

    // Atualiza o comando da máquina para 'off'
    const { error: commandError } = await setMachineCommand(actualMachineId, 'off');

    if (commandError) {
      console.error('Error setting machine command to off:', commandError);
      return NextResponse.json(
        { error: 'Erro ao desativar máquina' },
        { status: 500 }
      );
    }

    // Busca o último registro de ativação que está em andamento
    const { data: historyData, error: historyError } = await getActivationHistoryByMachine(actualMachineId);

    if (!historyError && historyData && historyData.length > 0) {
      // Encontra o registro que está em andamento
      const activeRecord = historyData.find((h: ActivationHistory) => h.status === 'em_andamento' || !h.ended_at);
      
      if (activeRecord) {
        const startedAt = new Date(activeRecord.started_at);
        const endedAt = new Date();
        const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);

        // Atualiza o registro de ativação com o tempo de término
        await updateActivationHistory(activeRecord.id, {
          ended_at: endedAt.toISOString(),
          duration_minutes: durationMinutes,
          status: 'concluído'
        });

        return NextResponse.json(
          {
            success: true,
            message: `Máquina ${actualMachineId} desativada`,
            durationMinutes,
            machineId: actualMachineId
          },
          { status: 200 }
        );
      }
    }

    // Se não encontrou registro de ativação, apenas desativa
    return NextResponse.json(
      {
        success: true,
        message: `Máquina ${actualMachineId} desativada`,
        machineId: actualMachineId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in deactivate machine route:', error);
    return NextResponse.json(
      { error: 'Erro ao processar desativação da máquina' },
      { status: 500 }
    );
  }
}
