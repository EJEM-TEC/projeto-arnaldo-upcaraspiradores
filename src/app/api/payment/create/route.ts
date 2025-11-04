import { NextRequest, NextResponse } from 'next/server';
import { Payment, MercadoPagoConfig } from 'mercadopago';
import { createTransaction } from '@/lib/database';
import { detectCardBrand } from '@/lib/cardUtils';
import { randomUUID } from 'crypto';

// Interface seguindo exatamente a documentação do Mercado Pago
interface PaymentBody {
  transaction_amount: number;
  token?: string; // Opcional porque PIX não usa token
  description: string;
  installments: number;
  payment_method_id: string;
  issuer_id?: number; // Deve ser number, não string
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, paymentMethod, userId, description, payer, cardToken, cardNumber, issuerId } = body;

    if (!amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Amount and payment method are required' },
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

    // Cria cliente do Mercado Pago seguindo exatamente a documentação
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'MERCADOPAGO_ACCESS_TOKEN não configurado' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    // Gera idempotency key única para evitar duplicação
    const idempotencyKey = randomUUID();

    let paymentBody: PaymentBody;

    // Para PIX - não usa token, apenas payment_method_id
    if (paymentMethod === 'pix') {
      paymentBody = {
        transaction_amount: amountValue,
        description: description || `Crédito adicionado via PIX - R$ ${amountValue}`,
        installments: 1,
        payment_method_id: 'pix',
        payer: {
          email: payerEmail,
          identification: {
            type: 'CPF',
            number: payer.cpf.replace(/\D/g, ''),
          },
        },
      };
    } 
    // Para cartão de crédito - seguindo exatamente a documentação
    else if (paymentMethod === 'credit-card') {
      if (!cardToken) {
        return NextResponse.json(
          { error: 'Card token is required for credit card payments' },
          { status: 400 }
        );
      }

      // Detecta a bandeira do cartão para definir payment_method_id
      const cardBrand = detectCardBrand(cardNumber?.replace(/\s/g, '') || '');
      let paymentMethodId = 'visa'; // padrão
      
      if (cardBrand === 'mastercard' || cardBrand === 'master') {
        paymentMethodId = 'master';
      } else if (cardBrand === 'elo') {
        paymentMethodId = 'elo';
      } else if (cardBrand === 'amex' || cardBrand === 'american_express') {
        paymentMethodId = 'amex';
      }

      // Converte issuer_id para number se presente
      let issuerIdNumber: number | undefined = undefined;
      if (issuerId) {
        const parsed = parseInt(String(issuerId), 10);
        if (!isNaN(parsed)) {
          issuerIdNumber = parsed;
        }
      }

      paymentBody = {
        transaction_amount: amountValue,
        token: cardToken,
        description: description || `Crédito adicionado via Cartão - R$ ${amountValue}`,
        installments: 1,
        payment_method_id: paymentMethodId,
        issuer_id: issuerIdNumber, // Deve ser number ou undefined
        payer: {
          email: payerEmail,
          identification: {
            type: 'CPF',
            number: payer.cpf.replace(/\D/g, ''),
          },
        },
      };
    } else {
      return NextResponse.json(
        { error: 'Método de pagamento não suportado' },
        { status: 400 }
      );
    }

    console.log('Creating payment with data (following MercadoPago docs):');
    console.log(JSON.stringify(paymentBody, null, 2));
    console.log('Idempotency Key:', idempotencyKey);
    
    let result;
    try {
      // Chama exatamente como na documentação
      result = await payment.create({
        body: paymentBody,
        requestOptions: { idempotencyKey }
      });
      
      console.log('✅ Payment created successfully:', {
        id: result.id,
        status: result.status,
        status_detail: result.status_detail,
      });
    } catch (paymentError: unknown) {
      console.error('Payment creation error:', paymentError);
      
      // Captura detalhes do erro do MercadoPago
      let errorDetails = 'Unknown error';
      let errorMessage = 'Erro ao processar pagamento no Mercado Pago';
      let statusCode = 500;

      if (paymentError && typeof paymentError === 'object') {
        // Tenta extrair mensagem de erro
        if ('message' in paymentError) {
          errorDetails = String(paymentError.message);
          errorMessage = errorDetails;
        }
        
        // Tenta extrair causa do erro
        if ('cause' in paymentError && paymentError.cause) {
          console.error('Payment error cause:', paymentError.cause);
          if (typeof paymentError.cause === 'object' && 'message' in paymentError.cause) {
            errorDetails = String(paymentError.cause.message);
          }
        }
        
        // Tenta extrair resposta completa do erro
        if ('response' in paymentError && paymentError.response) {
          const response = paymentError.response as Record<string, unknown>;
          console.error('Payment error response:', JSON.stringify(response, null, 2));
          
          // MercadoPago retorna erros em formato específico
          if ('body' in response && response.body) {
            const body = response.body as Record<string, unknown>;
            if ('message' in body) {
              errorMessage = String(body.message);
            }
            if ('cause' in body && Array.isArray(body.cause)) {
              const causes = body.cause as Array<Record<string, unknown>>;
              if (causes.length > 0 && 'description' in causes[0]) {
                errorDetails = String(causes[0].description);
                errorMessage = errorDetails;
              }
            }
            if ('error' in body && typeof body.error === 'string') {
              errorMessage = body.error;
            }
          }
          
          // Status HTTP do erro
          if ('status' in response && typeof response.status === 'number') {
            statusCode = response.status;
          }
        }
        
        // Status do erro
        if ('status' in paymentError && typeof paymentError.status === 'number') {
          statusCode = paymentError.status;
          console.error('Payment error status:', statusCode);
        }
      }
      
      console.error('Final error message:', errorMessage);
      console.error('Final error details:', errorDetails);
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          // Mostra detalhes completos apenas em desenvolvimento
          ...(process.env.NODE_ENV === 'development' && { 
            fullError: paymentError 
          })
        },
        { status: statusCode }
      );
    }

      // Se o pagamento foi criado com sucesso, cria a transação no banco
      if (result && result.id) {
        try {
          await createTransaction({
            user_id: userId || null,
            amount: amountValue,
            type: 'entrada',
            description: `Pagamento via ${paymentMethod} - ID: ${result.id} - Status: ${result.status}`,
            payment_method: paymentMethod,
          });
        } catch (transactionError) {
          console.error('Error creating transaction in database:', transactionError);
          // Não falha o pagamento se apenas a transação no banco falhar
        }

        // Retorna dados específicos baseado no método de pagamento
        const response: {
          success: boolean;
          paymentId: number | string;
          status?: string;
          pixCode?: string | null;
          pixQrCode?: string | null;
          ticketUrl?: string | null;
        } = {
          success: true,
          paymentId: result.id,
          status: result.status,
        };

        // Para PIX, retorna os dados do QR Code
        if (paymentMethod === 'pix') {
          const pointOfInteraction = result.point_of_interaction;
          const transactionData = pointOfInteraction?.transaction_data;
          
          response.pixCode = transactionData?.qr_code || null;
          response.pixQrCode = transactionData?.qr_code_base64 || null;
          response.ticketUrl = transactionData?.ticket_url || null;
        }

        return NextResponse.json(response);
      }

      return NextResponse.json(
        { error: 'Failed to create payment - no payment ID returned' },
        { status: 500 }
      );
  } catch (error) {
    console.error('Error creating payment:', error);
    
    // Captura mais detalhes do erro
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

