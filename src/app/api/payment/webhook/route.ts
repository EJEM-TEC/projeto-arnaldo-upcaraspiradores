import { NextRequest, NextResponse } from 'next/server';
import { createPaymentClient } from '@/lib/mercadopago';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verifica se é uma notificação do Mercado Pago
    const { type, data } = body;

    if (type === 'payment') {
      const paymentId = data?.id;
      
      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      console.log(`Payment notification received: ${paymentId}`);

      // Busca os detalhes do pagamento no Mercado Pago
      try {
        const payment = createPaymentClient();
        const paymentDetails = await payment.get({ id: Number(paymentId) });

        if (paymentDetails && paymentDetails.id) {
          const status = paymentDetails.status;
          const externalReference = paymentDetails.external_reference || '';
          
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
              }
            }
          }

          // Se o pagamento foi aprovado, pode adicionar lógica adicional aqui
          if (status === 'approved') {
            console.log(`Payment ${paymentId} approved for user ${userId}`);
            // Aqui você pode adicionar lógica para creditar saldo, enviar email, etc.
          } else if (status === 'rejected' || status === 'cancelled') {
            console.log(`Payment ${paymentId} ${status} for user ${userId}`);
          }
        }
      } catch (fetchError) {
        console.error('Error fetching payment details:', fetchError);
        // Continua mesmo com erro, para não bloquear o webhook
      }
    }

    // Trata notificações de preapproval (assinaturas)
    if (type === 'preapproval') {
      const preapprovalId = data?.id;
      
      if (!preapprovalId) {
        return NextResponse.json({ received: true });
      }

      console.log(`Preapproval notification received: ${preapprovalId}`);
      
      // Aqui você pode adicionar lógica para processar notificações de assinaturas
      // Por exemplo, quando uma cobrança mensal é processada
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Sempre retorna sucesso para o Mercado Pago, mesmo com erro interno
    // para evitar reenvios desnecessários
    return NextResponse.json({ received: true });
  }
}

// GET para verificação (Mercado Pago pode fazer GET para validar o endpoint)
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

