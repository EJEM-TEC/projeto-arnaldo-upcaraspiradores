import { NextRequest, NextResponse } from 'next/server';
import { getUserBalance } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const { data, error } = await getUserBalance(userId);

    if (error) {
      console.error('Error fetching balance:', error);
      return NextResponse.json(
        { error: 'Erro ao obter saldo' },
        { status: 500 }
      );
    }

    // saldo é armazenado em inteiros (reais x 100 ou apenas reais como inteiro)
    // Retorna o valor bruto do banco para que o cliente possa fazer a conversão
    const balanceValue = data?.saldo || 0;

    return NextResponse.json(
      {
        userId,
        balance: balanceValue, // Valor inteiro (pode ser em centavos ou reais)
        formatted: `R$ ${(balanceValue).toFixed(2).replace('.', ',')}`
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in get balance route:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
