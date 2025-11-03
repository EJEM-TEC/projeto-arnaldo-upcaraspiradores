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

    // Valida e formata o mês de expiração
    if (!cardExpirationMonth) {
      return NextResponse.json(
        { error: 'Mês de expiração é obrigatório' },
        { status: 400 }
      );
    }
    
    // Converte para número e valida
    const monthNum = parseInt(String(cardExpirationMonth).replace(/\D/g, ''), 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Mês de expiração inválido (deve ser entre 1 e 12)' },
        { status: 400 }
      );
    }
    const expirationMonth = String(monthNum).padStart(2, '0');

    // Valida e formata o ano de expiração
    if (!cardExpirationYear) {
      return NextResponse.json(
        { error: 'Ano de expiração é obrigatório' },
        { status: 400 }
      );
    }
    
    const yearStr = String(cardExpirationYear).replace(/\D/g, '');
    let expirationYear: string;
    if (yearStr.length === 2) {
      expirationYear = `20${yearStr}`;
    } else if (yearStr.length === 4) {
      expirationYear = yearStr;
    } else {
      return NextResponse.json(
        { error: 'Ano de expiração inválido' },
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
      card_expiration_month: expirationMonth,
      card_expiration_year: expirationYear,
      security_code: securityCode,
    };

    // Adiciona dados de identificação se fornecidos
    if (identificationNumber) {
      tokenBody.cardholder_identification = {
        type: identificationType || 'CPF',
        number: identificationNumber.replace(/\D/g, ''),
      };
    }

    console.log('Creating card token with data:', {
      card_number: `${cleanedCardNumber.substring(0, 4)}****${cleanedCardNumber.substring(cleanedCardNumber.length - 4)}`,
      cardholder_name: cardholderName,
      card_expiration_month: expirationMonth,
      card_expiration_year: expirationYear,
      has_identification: !!tokenBody.cardholder_identification,
      raw_month: cardExpirationMonth,
      raw_year: cardExpirationYear,
    });

    let result;
    try {
      result = await cardToken.create({
        body: tokenBody as Parameters<typeof cardToken.create>[0]['body'],
      });
      console.log('Card token created successfully:', result.id);
    } catch (tokenError: unknown) {
      console.error('Card token creation error:', tokenError);
      
      // Captura detalhes do erro do MercadoPago
      let errorDetails = 'Unknown error';
      if (tokenError && typeof tokenError === 'object') {
        if ('message' in tokenError) {
          errorDetails = String(tokenError.message);
        }
        if ('cause' in tokenError && tokenError.cause) {
          console.error('Token error cause:', tokenError.cause);
        }
        if ('status' in tokenError) {
          console.error('Token error status:', tokenError.status);
        }
        if ('response' in tokenError) {
          console.error('Token error response:', tokenError.response);
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Erro ao criar token do cartão',
          details: errorDetails 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: result.id,
      cardBrand: cardBrand, // Retorna a bandeira detectada
    });
  } catch (error) {
    console.error('Error creating card token:', error);
    
    // Captura mais detalhes do erro
    let errorMessage = 'Failed to create card token';
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

