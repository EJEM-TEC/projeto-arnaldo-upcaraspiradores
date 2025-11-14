import { NextRequest, NextResponse } from 'next/server';
import { 
  setMachineCommand,
  updateActivationHistory,
  getActivationHistoryByMachine,
  ActivationHistory
} from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { machineId } = body;

    if (!machineId) {
      return NextResponse.json(
        { error: 'Missing required field: machineId' },
        { status: 400 }
      );
    }

    // Atualiza o comando da máquina para 'off'
    const { error: commandError } = await setMachineCommand(machineId, 'off');

    if (commandError) {
      console.error('Error setting machine command to off:', commandError);
      return NextResponse.json(
        { error: 'Erro ao desativar máquina' },
        { status: 500 }
      );
    }

    // Busca o último registro de ativação que está em andamento
    const { data: historyData, error: historyError } = await getActivationHistoryByMachine(machineId);

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
            message: `Máquina ${machineId} desativada`,
            durationMinutes,
            machineId
          },
          { status: 200 }
        );
      }
    }

    // Se não encontrou registro de ativação, apenas desativa
    return NextResponse.json(
      {
        success: true,
        message: `Máquina ${machineId} desativada`,
        machineId
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
