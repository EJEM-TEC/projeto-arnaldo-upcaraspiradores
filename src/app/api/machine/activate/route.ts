import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { 
  decrementUserBalance, 
  setMachineCommand, 
  createActivationHistory,
  updateActivationHistoryWithUser,
  ensureProfileExists
} from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, machineSlug, machineId, durationMinutes } = body;

    if (!userId || (!machineSlug && !machineId) || !durationMinutes) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, (machineSlug or machineId), durationMinutes' },
        { status: 400 }
      );
    }

    // Garante que o perfil do usuário existe
    await ensureProfileExists(userId);

    // Se tem slug, busca o ID da máquina
    let actualMachineId = machineId;
    if (machineSlug && !machineId) {
      const { data: machineData, error: machineError } = await supabaseServer
        .from('machines')
        .select('id')
        .eq('slug_id', machineSlug)
        .maybeSingle();
      
      if (machineError || !machineData) {
        console.error('[ACTIVATE] Error finding machine by slug:', machineError);
        return NextResponse.json(
          { error: 'Máquina não encontrada' },
          { status: 404 }
        );
      }
      actualMachineId = machineData.id;
    }

    // Calcula o preço (R$ 1 por minuto, pode ser ajustado)
    const pricePerMinute = 1;
    const totalPrice = durationMinutes * pricePerMinute;

    // Verifica o saldo do usuário - faz query direto com service_role
    const { data: balanceData, error: balanceError } = await supabaseServer
      .from('profiles')
      .select('saldo')
      .eq('id', userId)
      .maybeSingle();
    
    if (balanceError) {
      console.error('[ACTIVATE] Error fetching balance:', balanceError);
      return NextResponse.json(
        { error: 'Erro ao verificar saldo' },
        { status: 500 }
      );
    }

    // Log detalhado para debug
    console.log(`[ACTIVATE DEBUG] balanceData:`, JSON.stringify(balanceData, null, 2));
    console.log(`[ACTIVATE DEBUG] balanceData.saldo type:`, typeof balanceData?.saldo);
    console.log(`[ACTIVATE DEBUG] balanceData.saldo value:`, balanceData?.saldo);

    // Garante que o saldo é um número válido
    const rawSaldo = balanceData?.saldo;
    const currentBalance = Number(rawSaldo) || 0;
    console.log(`[ACTIVATE] User ${userId} balance check: currentBalance=${currentBalance} vs required=${totalPrice}`);
    console.log(`[ACTIVATE] Has enough balance? ${currentBalance >= totalPrice}`);

    // Verifica se o saldo é suficiente
    if (currentBalance < totalPrice) {
      console.error(`[ACTIVATE ERROR] Insufficient balance: ${currentBalance} < ${totalPrice}`);
      return NextResponse.json(
        { 
          error: 'Saldo insuficiente', 
          currentBalance,
          requiredBalance: totalPrice,
          message: `Saldo disponível: R$ ${currentBalance}, necessário: R$ ${totalPrice}`
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
    const { error: commandError } = await setMachineCommand(actualMachineId, 'on');

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
      machine_id: actualMachineId,
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
        message: `Máquina ${actualMachineId} ativada por ${durationMinutes} minutos`,
        durationMinutes,
        totalPrice,
        newBalance: currentBalance - totalPrice,
        machineId: actualMachineId,
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
