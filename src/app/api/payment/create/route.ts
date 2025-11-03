import { NextRequest, NextResponse } from 'next/server';
import { createPaymentClient } from '@/lib/mercadopago';
import { createTransaction } from '@/lib/database';

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
      'http://localhost:3000';

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
      paymentData.payment_method_id = 'visa'; // Será determinado automaticamente pelo token
    }

    // Cria o pagamento no Mercado Pago
    const payment = createPaymentClient();
    const result = await payment.create({ body: paymentData });

    // Se o pagamento foi criado com sucesso, cria a transação no banco
    if (result.id) {
      await createTransaction({
        user_id: userId || null,
        amount: amountValue,
        type: 'entrada',
        description: `Pagamento via ${paymentMethod} - ID: ${result.id} - Status: ${result.status}`,
        payment_method: paymentMethod,
      });

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
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error creating payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

