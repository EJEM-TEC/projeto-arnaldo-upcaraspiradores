import { NextRequest, NextResponse } from 'next/server';
import { createTransaction } from '@/lib/database';

// Para assinaturas recorrentes, usaremos Preapproval do Mercado Pago
// que permite cobranças automáticas mensais

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, userId, payer, cardToken, description } = body;

    console.log('[SUBSCRIPTION] Creating subscription with payload:', {
      amount,
      userId,
      payer: payer?.email,
      description,
      timestamp: new Date().toISOString(),
    });

    if (!amount || !cardToken || !payer) {
      console.error('[SUBSCRIPTION] Missing required fields');
      return NextResponse.json(
        { error: 'Amount, card token and payer information are required' },
        { status: 400 }
      );
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      console.error('[SUBSCRIPTION] Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'https://projeto-arnaldo-upcaraspiradores.vercel.app';

    const preapprovalData = {
      reason: description || `Assinatura mensal - R$ ${amount}`,
      auto_recurring: {
        frequency: 1, // 1 = mensal
        frequency_type: 'months',
        transaction_amount: amountValue,
        currency_id: 'BRL',
        start_date: new Date(Date.now() + 86400000 * 15).toISOString(),
        end_date: null,
      },
      payer_email: payer.email || 'payer@example.com',
      card_token_id: cardToken,
      external_reference: `SUBSCRIPTION_USER_${userId || 'guest'}_${Date.now()}`,
      notification_url: `${baseUrl}/api/payment/webhook`,
    };

    console.log('[SUBSCRIPTION] Sending to Mercado Pago:', {
      amount: amountValue,
      payer_email: preapprovalData.payer_email,
      start_date: preapprovalData.auto_recurring.start_date,
    });

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
      console.error('[SUBSCRIPTION] Mercado Pago error:', {
        status: response.status,
        error: result.message,
        details: result,
      });
      return NextResponse.json(
        { error: result.message || 'Failed to create subscription' },
        { status: response.status }
      );
    }

    console.log('[SUBSCRIPTION] Successfully created:', {
      subscriptionId: result.id,
      status: result.status,
      payer_email: result.payer_email,
    });

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

    console.error('[SUBSCRIPTION] No subscription ID returned from Mercado Pago');
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[SUBSCRIPTION] Error creating subscription:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

