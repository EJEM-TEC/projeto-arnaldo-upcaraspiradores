import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createTransaction } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, userId, payer, description } = body;

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
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

    // Valida email do pagador
    const payerEmail = payer?.email;
    if (!payerEmail || !payerEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido do pagador' },
        { status: 400 }
      );
    }

    // Valida identificação do pagador
    if (!payer?.cpf) {
      return NextResponse.json(
        { error: 'CPF do pagador é obrigatório' },
        { status: 400 }
      );
    }

    // Cria cliente do Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'MERCADOPAGO_ACCESS_TOKEN não configurado' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    // URL base da aplicação
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'https://projeto-arnaldo-upcaraspiradores.vercel.app';

    // External reference para identificar o pagamento
    const externalReference = `USER_${userId || 'guest'}_${Date.now()}`;

    // Cria a preferência de pagamento (Checkout Pro)
    const preferenceData = {
      items: [
        {
          id: `credit_${userId || 'guest'}_${Date.now()}`,
          title: description || `Adicionar crédito - R$ ${amountValue}`,
          quantity: 1,
          unit_price: amountValue,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: payerEmail,
        identification: {
          type: 'CPF',
          number: payer.cpf.replace(/\D/g, ''),
        },
      },
      external_reference: externalReference,
      notification_url: `${baseUrl}/api/payment/webhook`,
      back_urls: {
        success: `${baseUrl}/payment/success?external_reference=${externalReference}`,
        failure: `${baseUrl}/payment/failure?external_reference=${externalReference}`,
        pending: `${baseUrl}/payment/pending?external_reference=${externalReference}`,
      },
      auto_return: 'approved', // Redireciona automaticamente quando aprovado
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12, // Máximo de parcelas
      },
      statement_descriptor: 'UP CAR ASPIRADORES',
    };

    console.log('Creating Checkout Pro preference:', JSON.stringify(preferenceData, null, 2));

    // Usa 'as any' para evitar problemas de tipagem estrita do SDK
    // O SDK pode ter tipos mais restritivos que a API real aceita
    const result = await preference.create({ body: preferenceData as any });

    if (!result || !result.id) {
      return NextResponse.json(
        { error: 'Failed to create preference' },
        { status: 500 }
      );
    }

    // Cria uma transação pendente no banco de dados
    try {
      await createTransaction({
        user_id: userId || null,
        amount: amountValue,
        type: 'entrada',
        description: `Pagamento Checkout Pro criado - Preference ID: ${result.id} - Status: pending`,
        payment_method: 'checkout-pro',
      });
    } catch (transactionError) {
      console.error('Error creating transaction in database:', transactionError);
      // Não falha a criação da preferência se apenas a transação no banco falhar
    }

    // Retorna os dados da preferência
    return NextResponse.json({
      success: true,
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
      externalReference: externalReference,
    });
  } catch (error) {
    console.error('Error creating checkout pro preference:', error);
    
    let errorMessage = 'Internal server error';
    let errorDetails: unknown = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (error && typeof error === 'object') {
      errorDetails = error;
      if ('message' in error) {
        errorMessage = String(error.message);
      }
    }
    
    console.error('Full error details:', JSON.stringify(errorDetails, null, 2));
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}

