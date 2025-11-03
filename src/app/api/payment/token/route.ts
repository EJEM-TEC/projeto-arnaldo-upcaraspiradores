import { NextRequest, NextResponse } from 'next/server';
import { createCardTokenClient } from '@/lib/mercadopago';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardNumber, cardholderName, cardExpirationMonth, cardExpirationYear, securityCode, identificationType, identificationNumber } = body;

    if (!cardNumber || !cardholderName || !cardExpirationMonth || !cardExpirationYear || !securityCode) {
      return NextResponse.json(
        { error: 'Missing required card information' },
        { status: 400 }
      );
    }

    // Cria o token do cartão no Mercado Pago
    const cardToken = createCardTokenClient();
    const result = await cardToken.create({
      body: {
        card_number: cardNumber.replace(/\s/g, ''),
        cardholder: {
          name: cardholderName,
          identification: {
            type: identificationType || 'CPF',
            number: identificationNumber?.replace(/\D/g, '') || '',
          },
        },
        card_expiration_month: cardExpirationMonth,
        card_expiration_year: cardExpirationYear,
        security_code: securityCode,
      },
    });

    return NextResponse.json({
      token: result.id,
    });
  } catch (error) {
    console.error('Error creating card token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create card token';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

