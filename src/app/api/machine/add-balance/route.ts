import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/machine/add-balance called');
    const body = await request.json();
    const { userId, amount } = body;

    console.log('📊 Request data:', { userId, amount });

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount' },
        { status: 400 }
      );
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    console.log(`💰 Fetching current balance for user ${userId}`);

    // Busca o saldo atual do usuário
    const { data: currentBalance, error: fetchError } = await supabaseServer
      .from('profiles')
      .select('saldo')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error fetching balance:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao obter saldo', details: fetchError.message },
        { status: 500 }
      );
    }

    const currentSaldo = Math.round(currentBalance?.saldo || 0);
    const amountRounded = Math.round(amountValue);
    const newSaldo = Math.round(currentSaldo + amountRounded);

    console.log(`📈 Calculating new balance: ${currentSaldo} + ${amountValue} = ${newSaldo}`);

    // Incrementa o saldo usando service role (bypass RLS)
    const { data, error } = await supabaseServer
      .from('profiles')
      .upsert({
        id: userId,
        saldo: newSaldo,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error incrementing balance:', error);
      return NextResponse.json(
        { error: 'Erro ao incrementar saldo', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Balance incremented for user ${userId}: ${currentSaldo} + ${amountValue} = ${newSaldo}`);

    return NextResponse.json(
      {
        success: true,
        message: `Saldo adicionado com sucesso`,
        userId,
        amount: amountValue,
        newBalance: data?.saldo,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Unexpected error in add balance route:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação', details: String(error) },
      { status: 500 }
    );
  }
}
