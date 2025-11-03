import { NextRequest, NextResponse } from 'next/server';
import { createCardTokenClient } from '@/lib/mercadopago';
import { detectCardBrand, validateCardNumber } from '@/lib/cardUtils';

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

    // Valida o número do cartão
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (!validateCardNumber(cleanedCardNumber)) {
      return NextResponse.json(
        { error: 'Invalid card number' },
        { status: 400 }
      );
    }

    // Detecta a bandeira do cartão
    const cardBrand = detectCardBrand(cleanedCardNumber);

    // Cria o token do cartão no Mercado Pago
    const cardToken = createCardTokenClient();
    const tokenBody: Record<string, unknown> = {
      card_number: cleanedCardNumber,
      cardholder_name: cardholderName,
      card_expiration_month: String(cardExpirationMonth).padStart(2, '0'),
      card_expiration_year: String(cardExpirationYear).length === 2 
        ? `20${cardExpirationYear}` 
        : cardExpirationYear,
      security_code: securityCode,
    };

    // Adiciona dados de identificação se fornecidos
    if (identificationNumber) {
      tokenBody.cardholder_identification = {
        type: identificationType || 'CPF',
        number: identificationNumber.replace(/\D/g, ''),
      };
    }

    const result = await cardToken.create({
      body: tokenBody as Parameters<typeof cardToken.create>[0]['body'],
    });

    return NextResponse.json({
      token: result.id,
      cardBrand: cardBrand, // Retorna a bandeira detectada
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

