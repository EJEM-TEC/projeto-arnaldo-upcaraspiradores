import { NextRequest, NextResponse } from 'next/server';
import { createPaymentClient } from '@/lib/mercadopago';
import { supabase } from '@/lib/supabaseClient';

// GET para verificação (Mercado Pago pode fazer GET para validar o endpoint)
export async function GET(request: NextRequest) {
  console.log('Webhook GET request received');
  return NextResponse.json({ status: 'ok', message: 'Webhook endpoint is active' }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    console.log('Webhook POST request received');
    
    // Lê o body da requisição
    let body;
    try {
      body = await request.json();
      console.log('Webhook body received:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('Error parsing webhook body:', parseError);
      // Tenta ler como texto
      const text = await request.text();
      console.log('Webhook body as text:', text);
      
      // Sempre retorna 200 mesmo com erro de parse para não bloquear o webhook
      return NextResponse.json({ received: true, error: 'Failed to parse body' }, { status: 200 });
    }
    
    // Verifica se é uma notificação do Mercado Pago
    const { type, data, action } = body;

    console.log(`Webhook notification - Type: ${type}, Action: ${action}, Data:`, data);

    // Trata notificações de pagamento
    if (type === 'payment' || action === 'payment.updated' || action === 'payment.created') {
      const paymentId = data?.id || body.id;
      
      if (!paymentId) {
        console.log('No payment ID found in webhook data');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      console.log(`Processing payment notification: ${paymentId}`);

      // Busca os detalhes do pagamento no Mercado Pago
      try {
        const payment = createPaymentClient();
        const paymentDetails = await payment.get({ id: Number(paymentId) });

        if (paymentDetails && paymentDetails.id) {
          const status = paymentDetails.status;
          const externalReference = paymentDetails.external_reference || '';
          
          console.log(`Payment ${paymentId} status: ${status}, external_reference: ${externalReference}`);
          
          // Extrai userId do external_reference (formato: USER_uuid ou SUBSCRIPTION_USER_uuid)
          const userMatch = externalReference.match(/USER_([^_]+)/);
          const userId = userMatch ? userMatch[1] : null;

          // Atualiza a transação no banco de dados
          if (userId && userId !== 'guest') {
            const paymentMethodId = paymentDetails.payment_method_id || 'unknown';
            
            // Busca a transação existente
            const { data: existingTransaction } = await supabase
              .from('transactions')
              .select('id')
              .eq('user_id', userId)
              .like('description', `%ID: ${paymentId}%`)
              .maybeSingle();

            if (existingTransaction) {
              // Atualiza a transação existente
              const { error: updateError } = await supabase
                .from('transactions')
                .update({
                  description: `Pagamento via ${paymentMethodId} - ID: ${paymentId} - Status: ${status}`,
                })
                .eq('id', existingTransaction.id);

              if (updateError) {
                console.error('Error updating transaction:', updateError);
              } else {
                console.log(`Transaction updated for payment ${paymentId}`);
              }
            } else {
              console.log(`No existing transaction found for payment ${paymentId}`);
            }
          }

          // Se o pagamento foi aprovado, pode adicionar lógica adicional aqui
          if (status === 'approved') {
            console.log(`Payment ${paymentId} approved for user ${userId}`);
            // Aqui você pode adicionar lógica para creditar saldo, enviar email, etc.
          } else if (status === 'rejected' || status === 'cancelled') {
            console.log(`Payment ${paymentId} ${status} for user ${userId}`);
          }
        } else {
          console.log(`Payment details not found for ID: ${paymentId}`);
        }
      } catch (fetchError) {
        console.error('Error fetching payment details:', fetchError);
        // Continua mesmo com erro, para não bloquear o webhook
      }
    }

    // Trata notificações de preapproval (assinaturas)
    if (type === 'preapproval' || action === 'preapproval.updated') {
      const preapprovalId = data?.id || body.id;
      
      if (!preapprovalId) {
        console.log('No preapproval ID found in webhook data');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      console.log(`Preapproval notification received: ${preapprovalId}`);
      
      // Aqui você pode adicionar lógica para processar notificações de assinaturas
      // Por exemplo, quando uma cobrança mensal é processada
    }

    // Sempre retorna 200 OK para o Mercado Pago
    return NextResponse.json({ received: true, processed: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Sempre retorna sucesso para o Mercado Pago, mesmo com erro interno
    // para evitar reenvios desnecessários
    return NextResponse.json({ 
      received: true, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 200 });
  }
}

