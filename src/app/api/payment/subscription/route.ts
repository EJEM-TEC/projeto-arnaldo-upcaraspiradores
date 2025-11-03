import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoClient } from '@/lib/mercadopago';
import { createTransaction } from '@/lib/database';

// Para assinaturas recorrentes, usaremos Preapproval do Mercado Pago
// que permite cobranças automáticas mensais

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, userId, payer, cardToken, description } = body;

    if (!amount || !cardToken || !payer) {
      return NextResponse.json(
        { error: 'Amount, card token and payer information are required' },
        { status: 400 }
      );
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'https://projeto-arnaldo-upcaraspiradores.vercel.app/home';

    // Cria um Preapproval (Assinatura Recorrente) no Mercado Pago
    // Isso permite cobranças automáticas mensais
    const client = getMercadoPagoClient();
    
    // Para criar assinatura, precisamos usar a API REST diretamente
    // pois o SDK pode não ter suporte completo
    const preapprovalData = {
      reason: description || `Assinatura mensal - R$ ${amount}`,
      auto_recurring: {
        frequency: 1, // 1 = mensal
        frequency_type: 'months',
        transaction_amount: amountValue,
        currency_id: 'BRL',
        start_date: new Date(Date.now() + 86400000 * 15).toISOString(), // Próximo dia 15
        end_date: null, // Sem data de término
      },
      payer_email: payer.email || 'payer@example.com',
      card_token_id: cardToken,
      external_reference: `SUBSCRIPTION_USER_${userId || 'guest'}_${Date.now()}`,
      notification_url: `${baseUrl}/api/payment/webhook`,
    };

    // Faz requisição direta à API do Mercado Pago
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preapprovalData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('MercadoPago API error:', result);
      return NextResponse.json(
        { error: result.message || 'Failed to create subscription' },
        { status: response.status }
      );
    }

    // Se a assinatura foi criada com sucesso, cria a transação no banco
    if (result.id) {
      await createTransaction({
        user_id: userId || null,
        amount: amountValue,
        type: 'entrada',
        description: `Assinatura mensal criada - Preapproval ID: ${result.id}`,
        payment_method: 'monthly',
      });

      return NextResponse.json({
        success: true,
        subscriptionId: result.id,
        status: result.status,
        init_point: result.init_point,
        sandbox_init_point: result.sandbox_init_point,
      });
    }

    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

