import { NextRequest, NextResponse } from 'next/server';
import { createPaymentClient } from '@/lib/mercadopago';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferenceId, externalReference } = body;

    if (!preferenceId && !externalReference) {
      return NextResponse.json(
        { error: 'preferenceId or externalReference is required' },
        { status: 400 }
      );
    }

    // Busca pagamentos relacionados à preferência ou external_reference
    const payment = createPaymentClient();
    
    // Se temos external_reference, podemos buscar pagamentos por ele
    if (externalReference) {
      // Extrai userId do external_reference
      const userMatch = externalReference.match(/USER_([^_]+)/);
      const userId = userMatch ? userMatch[1] : null;

      if (userId && userId !== 'guest') {
        // Busca pagamentos recentes do usuário
        // Nota: A API do Mercado Pago não permite buscar diretamente por external_reference
        // Mas podemos verificar via webhook ou armazenar o preference_id
        // Por enquanto, retornamos que precisa verificar via webhook
        return NextResponse.json({
          status: 'pending',
          message: 'Verificando status do pagamento...',
          requiresWebhook: true,
        });
      }
    }

    // Se temos preferenceId, podemos buscar informações da preferência
    // Mas a preferência não tem status direto, precisamos buscar os pagamentos
    return NextResponse.json({
      status: 'pending',
      message: 'Status do pagamento será atualizado via webhook',
      requiresWebhook: true,
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      },
      { status: 500 }
    );
  }
}

