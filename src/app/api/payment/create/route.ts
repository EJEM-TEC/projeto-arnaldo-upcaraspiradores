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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, paymentMethod, userId, description, payer } = body;

    if (!amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Amount and payment method are required' },
        { status: 400 }
      );
    }

    // Monta os dados do pagamento baseado no método
    const paymentData: PaymentData = {
      transaction_amount: parseFloat(amount),
      description: description || `Crédito adicionado - ${paymentMethod}`,
      ...(paymentMethod === 'credit-card' && { payment_method_id: 'visa' }),
      payer: {
        email: payer?.email || 'payer@example.com',
        identification: payer?.cpf ? {
          type: 'CPF',
          number: payer.cpf.replace(/\D/g, ''),
        } : undefined,
      },
      external_reference: `USER_${userId || 'guest'}_${Date.now()}`,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
    };

    // Para PIX
    if (paymentMethod === 'pix') {
      paymentData.payment_method_id = 'pix';
    }

    // Para cartão de crédito
    if (paymentMethod === 'credit-card' && body.cardToken) {
      paymentData.token = body.cardToken;
      paymentData.installments = 1;
      paymentData.payer = {
        ...paymentData.payer,
        email: payer?.email || 'payer@example.com',
      };
    }

    // Cria o pagamento no Mercado Pago
    const payment = createPaymentClient();
    const result = await payment.create({ body: paymentData });

    // Se o pagamento foi criado com sucesso, cria a transação no banco
    if (result.id) {
      await createTransaction({
        user_id: userId || null,
        amount: parseFloat(amount),
        type: 'entrada',
        description: `Pagamento via ${paymentMethod} - ID: ${result.id}`,
        payment_method: paymentMethod,
      });

      return NextResponse.json({
        success: true,
        paymentId: result.id,
        status: result.status,
        pixCode: result.point_of_interaction?.transaction_data?.qr_code_base64 || null,
        pixQrCode: result.point_of_interaction?.transaction_data?.qr_code || null,
        ticketUrl: result.point_of_interaction?.transaction_data?.ticket_url || null,
      });
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

