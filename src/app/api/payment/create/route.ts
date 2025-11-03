import { NextRequest, NextResponse } from 'next/server';
import { createPaymentClient } from '@/lib/mercadopago';
import { createTransaction } from '@/lib/database';
import { detectCardBrand } from '@/lib/cardUtils';

interface PaymentData {
  transaction_amount: number;
  description: string;
  payment_method_id?: string;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  external_reference: string;
  notification_url: string;
  token?: string;
  installments?: number;
  statement_descriptor?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, paymentMethod, userId, description, payer, cardToken } = body;

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'https://projeto-arnaldo-upcaraspiradores.vercel.app';

    // Monta os dados do pagamento baseado no método
    const paymentData: PaymentData = {
      transaction_amount: amountValue,
      description: description || `Crédito adicionado - ${paymentMethod}`,
      statement_descriptor: 'UpCar Aspiradores',
      payer: {
        email: payer?.email || 'payer@example.com',
        identification: payer?.cpf ? {
          type: 'CPF',
          number: payer.cpf.replace(/\D/g, ''),
        } : undefined,
      },
      external_reference: `USER_${userId || 'guest'}_${Date.now()}`,
      notification_url: `${baseUrl}/api/payment/webhook`,
    };

    // Para PIX
    if (paymentMethod === 'pix') {
      paymentData.payment_method_id = 'pix';
    }

    // Para cartão de crédito
    if (paymentMethod === 'credit-card') {
      if (!cardToken) {
        return NextResponse.json(
          { error: 'Card token is required for credit card payments' },
          { status: 400 }
        );
      }
      paymentData.token = cardToken;
      paymentData.installments = 1;
      
      // NOTA: Não enviamos payment_method_id quando usamos token
      // O MercadoPago detecta automaticamente a bandeira pelo token
      // Se enviarmos ambos, pode causar conflito
    }

    // Cria o pagamento no Mercado Pago
    const payment = createPaymentClient();
    
    console.log('Creating payment with data:', JSON.stringify(paymentData, null, 2));
    
    let result;
    try {
      result = await payment.create({ body: paymentData });
      console.log('Payment created successfully:', result.id, result.status);
    } catch (paymentError: unknown) {
      console.error('Payment creation error:', paymentError);
      
      // Captura detalhes do erro do MercadoPago
      let errorDetails = 'Unknown error';
      if (paymentError && typeof paymentError === 'object') {
        if ('message' in paymentError) {
          errorDetails = String(paymentError.message);
        }
        if ('cause' in paymentError && paymentError.cause) {
          console.error('Payment error cause:', paymentError.cause);
        }
        // Se for um erro do MercadoPago SDK, pode ter mais informações
        if ('status' in paymentError) {
          console.error('Payment error status:', paymentError.status);
        }
        if ('response' in paymentError) {
          console.error('Payment error response:', paymentError.response);
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Erro ao processar pagamento no Mercado Pago',
          details: errorDetails 
        },
        { status: 500 }
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

