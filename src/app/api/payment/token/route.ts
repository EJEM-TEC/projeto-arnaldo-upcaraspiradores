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
    // O Mercado Pago aceita tanto string quanto número, mas vamos enviar como string com 2 dígitos
    // para garantir compatibilidade: "01" a "12"
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
    
    // Prepara o body com os tipos corretos
    // IMPORTANTE: Verificar se o campo está realmente sendo preenchido
    const tokenBody: {
      card_number: string;
      cardholder_name: string;
      card_expiration_month: string;
      card_expiration_year: string;
      security_code: string;
      cardholder_identification?: {
        type: string;
        number: string;
      };
    } = {
      card_number: cleanedCardNumber,
      cardholder_name: cardholderName,
      card_expiration_month: expirationMonth, // String com 2 dígitos (ex: "01", "12")
      card_expiration_year: expirationYear, // String com 4 dígitos (ex: "2025")
      security_code: String(securityCode),
    };
    
    // Validação de segurança: verifica se o mês não está vazio antes de enviar
    if (!expirationMonth || expirationMonth.trim() === '' || expirationMonth === '00') {
      console.error('ERROR: expirationMonth is empty or invalid:', expirationMonth);
      return NextResponse.json(
        { error: 'Mês de expiração inválido ou vazio' },
        { status: 400 }
      );
    }

    // Adiciona dados de identificação se fornecidos
    if (identificationNumber) {
      tokenBody.cardholder_identification = {
        type: identificationType || 'CPF',
        number: identificationNumber.replace(/\D/g, ''),
      };
    }

    // Log detalhado do que será enviado
    console.log('=== CARD TOKEN REQUEST ===');
    console.log('Raw input - month:', cardExpirationMonth, 'type:', typeof cardExpirationMonth);
    console.log('Raw input - year:', cardExpirationYear, 'type:', typeof cardExpirationYear);
    console.log('Processed - month:', expirationMonth, 'type:', typeof expirationMonth, 'length:', expirationMonth.length);
    console.log('Processed - year:', expirationYear, 'type:', typeof expirationYear, 'length:', expirationYear.length);
    console.log('tokenBody.card_expiration_month:', tokenBody.card_expiration_month);
    console.log('tokenBody.card_expiration_year:', tokenBody.card_expiration_year);
    console.log('Full tokenBody:', JSON.stringify(tokenBody, null, 2));
    console.log('==========================');

    let result;
    try {
      // Log final antes de enviar ao SDK
      console.log('=== SENDING TO MERCADOPAGO SDK ===');
      console.log('tokenBody before SDK call:', JSON.stringify(tokenBody, null, 2));
      console.log('card_expiration_month value:', tokenBody.card_expiration_month);
      console.log('card_expiration_month type:', typeof tokenBody.card_expiration_month);
      console.log('card_expiration_month length:', String(tokenBody.card_expiration_month).length);
      
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

