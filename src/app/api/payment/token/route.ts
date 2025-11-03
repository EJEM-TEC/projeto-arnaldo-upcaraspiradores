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
    // O Mercado Pago SDK espera o mês como STRING com 2 dígitos (ex: "01", "11")
    // Mas vamos garantir que seja sempre uma string válida
    const expirationMonth = String(monthNum).padStart(2, '0');
    
    // Validação extra: garante que não está vazio
    if (!expirationMonth || expirationMonth.trim() === '' || expirationMonth.length !== 2) {
      console.error('ERROR: expirationMonth is invalid after processing:', expirationMonth);
      return NextResponse.json(
        { error: 'Mês de expiração inválido após processamento' },
        { status: 400 }
      );
    }

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
    // O Mercado Pago SDK espera os campos específicos com nomes exatos
    // Vamos criar o objeto de forma explícita para garantir que todos os campos estão presentes
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
      card_number: String(cleanedCardNumber).trim(),
      cardholder_name: String(cardholderName).trim(),
      card_expiration_month: String(expirationMonth).trim(), // OBRIGATÓRIO: String "01" a "12"
      card_expiration_year: String(expirationYear).trim(), // OBRIGATÓRIO: String "2025", "2026", etc
      security_code: String(securityCode).trim(),
    };
    
    // Validação FINAL: verifica se todos os campos obrigatórios estão presentes e não vazios
    if (!tokenBody.card_expiration_month || 
        tokenBody.card_expiration_month.trim() === '' || 
        tokenBody.card_expiration_month.length !== 2 ||
        tokenBody.card_expiration_month === '00') {
      console.error('ERROR: card_expiration_month is empty or invalid:', tokenBody.card_expiration_month);
      return NextResponse.json(
        { error: `Mês de expiração inválido: "${tokenBody.card_expiration_month}"` },
        { status: 400 }
      );
    }
    
    if (!tokenBody.card_expiration_year || tokenBody.card_expiration_year.trim() === '') {
      console.error('ERROR: card_expiration_year is empty or invalid:', tokenBody.card_expiration_year);
      return NextResponse.json(
        { error: 'Ano de expiração inválido' },
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
    console.log('Input recebido:');
    console.log('  - cardExpirationMonth:', cardExpirationMonth, '(type:', typeof cardExpirationMonth, ')');
    console.log('  - cardExpirationYear:', cardExpirationYear, '(type:', typeof cardExpirationYear, ')');
    console.log('Processado:');
    console.log('  - expirationMonth:', expirationMonth, '(type:', typeof expirationMonth, ', length:', expirationMonth.length, ')');
    console.log('  - expirationYear:', expirationYear, '(type:', typeof expirationYear, ', length:', expirationYear.length, ')');
    console.log('TokenBody final:');
    console.log('  - card_expiration_month:', tokenBody.card_expiration_month, '(type:', typeof tokenBody.card_expiration_month, ')');
    console.log('  - card_expiration_year:', tokenBody.card_expiration_year, '(type:', typeof tokenBody.card_expiration_year, ')');
    console.log('TokenBody completo (JSON):');
    console.log(JSON.stringify(tokenBody, null, 2));
    console.log('==========================');

    // Prepara o body final - TRATANDO EXATAMENTE COMO OS OUTROS CAMPOS (todos como string)
    // O Mercado Pago recebe todos os campos como string, incluindo expiration_month
    // Vamos usar o mesmo padrão que card_number, card_expiration_year, etc.
    const finalBody: {
      card_number: string;
      cardholder_name: string;
      card_expiration_month: string; // STRING como os outros campos!
      card_expiration_year: string;
      security_code: string;
      cardholder_identification?: {
        type: string;
        number: string;
      };
    } = {
      card_number: tokenBody.card_number, // STRING
      cardholder_name: tokenBody.cardholder_name, // STRING
      card_expiration_month: tokenBody.card_expiration_month, // STRING (mesmo padrão dos outros)
      card_expiration_year: tokenBody.card_expiration_year, // STRING
      security_code: tokenBody.security_code, // STRING
    };
    
    // Adiciona identificação se presente
    if (tokenBody.cardholder_identification) {
      finalBody.cardholder_identification = tokenBody.cardholder_identification;
    }
    
    let result;
    try {
      // Log final antes de enviar ao SDK com verificação adicional
      console.log('=== SENDING TO MERCADOPAGO SDK ===');
      console.log('Verificando campos antes de enviar:');
      console.log('  card_expiration_month:', JSON.stringify(tokenBody.card_expiration_month));
      console.log('  card_expiration_month existe?', 'card_expiration_month' in tokenBody);
      console.log('  card_expiration_month é undefined?', tokenBody.card_expiration_month === undefined);
      console.log('  card_expiration_month é null?', tokenBody.card_expiration_month === null);
      console.log('  card_expiration_month é vazio?', tokenBody.card_expiration_month === '');
      console.log('TokenBody completo para envio:');
      console.log(JSON.stringify(tokenBody, null, 2));
      
      console.log('Final body que será enviado:');
      console.log(JSON.stringify(finalBody, null, 2));
      console.log('=== VERIFICAÇÃO DE TIPOS (todos devem ser STRING) ===');
      console.log('card_number tipo:', typeof finalBody.card_number);
      console.log('cardholder_name tipo:', typeof finalBody.cardholder_name);
      console.log('card_expiration_month valor:', finalBody.card_expiration_month);
      console.log('card_expiration_month tipo:', typeof finalBody.card_expiration_month);
      console.log('card_expiration_month é string?', typeof finalBody.card_expiration_month === 'string');
      console.log('card_expiration_year tipo:', typeof finalBody.card_expiration_year);
      console.log('security_code tipo:', typeof finalBody.security_code);
      console.log('Todos os campos são string?', 
        typeof finalBody.card_number === 'string' &&
        typeof finalBody.cardholder_name === 'string' &&
        typeof finalBody.card_expiration_month === 'string' &&
        typeof finalBody.card_expiration_year === 'string' &&
        typeof finalBody.security_code === 'string'
      );
      console.log('====================================================');
      
      result = await cardToken.create({
        body: finalBody as Parameters<typeof cardToken.create>[0]['body'],
      });
      console.log('✅ Card token created successfully:', result.id);
    } catch (tokenError: unknown) {
      console.error('=== ERRO AO CRIAR TOKEN DO CARTÃO ===');
      console.error('❌ Card token creation error:', tokenError);
      
      // LOG CRÍTICO: Mostra exatamente o que foi enviado quando houve erro
      console.error('=== PAYLOAD ENVIADO AO MERCADO PAGO (QUE RESULTOU EM ERRO) ===');
      console.error(JSON.stringify(finalBody, null, 2));
      console.error('=== DETALHES DO PAYLOAD ===');
      console.error('card_expiration_month:', finalBody.card_expiration_month);
      console.error('card_expiration_month tipo:', typeof finalBody.card_expiration_month);
      console.error('card_expiration_month existe?', 'card_expiration_month' in finalBody);
      console.error('card_expiration_year:', finalBody.card_expiration_year);
      console.error('card_expiration_year tipo:', typeof finalBody.card_expiration_year);
      console.error('Todos os campos do finalBody:', Object.keys(finalBody));
      console.error('Valores de todos os campos:', Object.entries(finalBody));
      console.error('==========================================');
      
      // Captura detalhes do erro do MercadoPago
      let errorDetails = 'Unknown error';
      let errorResponse: unknown = null;
      
      if (tokenError && typeof tokenError === 'object') {
        if ('message' in tokenError) {
          errorDetails = String(tokenError.message);
          console.error('Erro message:', errorDetails);
        }
        if ('cause' in tokenError && tokenError.cause) {
          console.error('Token error cause:', tokenError.cause);
          errorResponse = tokenError.cause;
        }
        if ('status' in tokenError) {
          console.error('Token error status:', tokenError.status);
        }
        if ('response' in tokenError && tokenError.response) {
          const response = tokenError.response as Record<string, unknown>;
          console.error('Token error response completo:', JSON.stringify(response, null, 2));
          
          // Tenta extrair o body da resposta do erro
          if ('body' in response && response.body) {
            console.error('Response body (erro do MercadoPago):', JSON.stringify(response.body, null, 2));
            errorResponse = response.body;
          }
          
          // Tenta extrair status code
          if ('status' in response) {
            console.error('HTTP Status Code:', response.status);
          }
        }
        
        // Log completo do erro
        console.error('=== ERRO COMPLETO ===');
        console.error(JSON.stringify(tokenError, null, 2));
      }
      
      return NextResponse.json(
        { 
          error: 'Erro ao criar token do cartão',
          details: errorDetails,
          // Em desenvolvimento, mostra o payload que foi enviado
          ...(process.env.NODE_ENV === 'development' && {
            sentPayload: finalBody,
            errorResponse: errorResponse
          })
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

