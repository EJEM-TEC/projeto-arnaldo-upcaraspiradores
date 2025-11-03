import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verifica se é uma notificação do Mercado Pago
    const { type, data } = body;

    if (type === 'payment') {
      const paymentId = data?.id;
      
      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      // Aqui você deveria buscar os detalhes do pagamento do Mercado Pago
      // Para simplificar, vamos apenas confirmar que recebemos a notificação
      
      console.log(`Payment notification received: ${paymentId}`);
      
      // Em produção, você deveria:
      // 1. Buscar o pagamento do Mercado Pago para verificar o status
      // 2. Atualizar a transação no banco de dados
      // 3. Creditar o saldo do usuário
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET para verificação (Mercado Pago pode fazer GET para validar o endpoint)
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

