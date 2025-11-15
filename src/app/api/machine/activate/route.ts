import { NextRequest, NextResponse } from 'next/server';
import { 
  decrementUserBalance, 
  setMachineCommand, 
  createActivationHistory,
  getUserBalance,
  updateActivationHistoryWithUser
} from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, machineId, durationMinutes } = body;

    if (!userId || !machineId || !durationMinutes) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, machineId, durationMinutes' },
        { status: 400 }
      );
    }

    // Calcula o preço (R$ 1 por minuto, pode ser ajustado)
    const pricePerMinute = 1;
    const totalPrice = durationMinutes * pricePerMinute;

    // Verifica o saldo do usuário
    const { data: balanceData, error: balanceError } = await getUserBalance(userId);
    
    if (balanceError) {
      console.error('Error fetching balance:', balanceError);
      return NextResponse.json(
        { error: 'Erro ao verificar saldo' },
        { status: 500 }
      );
    }

    const currentBalance = balanceData?.saldo || 0;

    // Verifica se o saldo é suficiente
    if (currentBalance < totalPrice) {
      return NextResponse.json(
        { 
          error: 'Saldo insuficiente', 
          currentBalance,
          requiredBalance: totalPrice 
        },
        { status: 402 }
      );
    }

    // Decrementa o saldo do usuário
    const { error: decrementError } = await decrementUserBalance(userId, totalPrice);

    if (decrementError) {
      console.error('Error decrementing balance:', decrementError);
      return NextResponse.json(
        { error: 'Erro ao descontar saldo' },
        { status: 500 }
      );
    }

    // Atualiza o comando da máquina para 'on'
    const { error: commandError } = await setMachineCommand(machineId, 'on');

    if (commandError) {
      console.error('Error setting machine command:', commandError);
      // Tenta reverter o saldo (não crítico se falhar)
      console.warn('Warning: Could not set machine command, but balance was already decremented');
      return NextResponse.json(
        { error: 'Erro ao ativar máquina' },
        { status: 500 }
      );
    }

    // Cria um registro de ativação
    const { data: historyData, error: historyError } = await createActivationHistory({
      machine_id: machineId,
      command: 'on',
      started_at: new Date().toISOString(),
      status: 'em_andamento'
    });

    if (historyError) {
      console.error('Error creating activation history:', historyError);
      // Não é crítico se o histórico não for criado
    } else if (historyData && historyData.id) {
      // Atualiza o histórico com user_id e cost
      await updateActivationHistoryWithUser(historyData.id, userId, totalPrice);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Máquina ${machineId} ativada por ${durationMinutes} minutos`,
        durationMinutes,
        totalPrice,
        newBalance: currentBalance - totalPrice,
        machineId,
        activationId: historyData?.id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in activate machine route:', error);
    return NextResponse.json(
      { error: 'Erro ao processar ativação da máquina' },
      { status: 500 }
    );
  }
}
