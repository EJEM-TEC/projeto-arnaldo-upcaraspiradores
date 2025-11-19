import { NextRequest, NextResponse } from 'next/server';
import { createPaymentClient } from '@/lib/mercadopago';
import { supabase } from '@/lib/supabaseClient';
import { supabaseServer } from '@/lib/supabaseServer';
import { createTransaction } from '@/lib/database';

type PaymentDetails = {
  id?: number | null;
  payment_method_id?: string | null;
  payment_type_id?: string | null;
  transaction_amount?: number | null;
  external_reference?: string | null;
  metadata?: Record<string, unknown> | null;
  status?: string | null;
  payer?: { email?: string } | null;
};

const normalizePaymentMethod = (details: PaymentDetails): string => {
  const methodId = (details.payment_method_id || '').toLowerCase();
  const typeId = (details.payment_type_id || '').toLowerCase();

  if (methodId === 'pix' || typeId === 'pix') {
    return 'pix';
  }

  if (typeId === 'credit_card') {
    return 'credit-card';
  }

  if (typeId === 'debit_card') {
    return 'debit-card';
  }

  if (typeId === 'account_money') {
    return 'app';
  }

  return 'checkout-pro';
};

type PaymentDetails = {
  payment_method_id?: string | null;
  payment_type_id?: string | null;
  transaction_amount?: number | null;
  external_reference?: string | null;
  metadata?: Record<string, unknown> | null;
  status?: string | null;
};

const normalizePaymentMethod = (details: PaymentDetails): string => {
  const methodId = (details.payment_method_id || '').toLowerCase();
  const typeId = (details.payment_type_id || '').toLowerCase();

  if (methodId === 'pix' || typeId === 'pix') {
    return 'pix';
  }

  if (typeId === 'credit_card') {
    return 'credit-card';
  }

  if (typeId === 'debit_card') {
    return 'debit-card';
  }

  if (typeId === 'account_money') {
    return 'app';
  }

  return 'checkout-pro';
};

// GET para verificação (Mercado Pago pode fazer GET para validar o endpoint)
export async function GET(_request: NextRequest) {
  console.log('[WEBHOOK] GET request received - endpoint is active');
  return NextResponse.json({ status: 'ok', message: 'Webhook endpoint is active' }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[WEBHOOK] POST request received at ${timestamp}`);
    
    // Lê o body da requisição
    let body;
    try {
      body = await request.json();
      console.log(`[WEBHOOK] Body received:`, JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error(`[WEBHOOK] Error parsing webhook body:`, parseError);
      const text = await request.text();
      console.log(`[WEBHOOK] Body as text:`, text);
      return NextResponse.json({ received: true, error: 'Failed to parse body' }, { status: 200 });
    }
    
    // Verifica se é uma notificação do Mercado Pago
    const { type, data, action } = body;

    console.log(`[WEBHOOK] Notification - Type: ${type}, Action: ${action}`);

    // Trata notificações de pagamento
    if (type === 'payment' || action === 'payment.updated' || action === 'payment.created') {
      const paymentId = data?.id || body.id;
      
      if (!paymentId) {
        console.log('[WEBHOOK] No payment ID found in webhook data');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      console.log(`[WEBHOOK] Processing payment notification: ${paymentId}`);

      // Busca os detalhes do pagamento no Mercado Pago
      try {
        const payment = createPaymentClient();
        const paymentDetails = (await payment.get({ id: Number(paymentId) })) as PaymentDetails;

        if (paymentDetails && paymentDetails.id) {
          const status = paymentDetails.status;
          const externalReference = paymentDetails.external_reference || '';
          const transactionAmount = paymentDetails.transaction_amount || 0;
          const paymentMethod = normalizePaymentMethod(paymentDetails);
          
          console.log(`[WEBHOOK] Payment ${paymentId}:`, {
            status,
            amount: transactionAmount,
            external_reference: externalReference,
            payment_method: paymentMethod,
            payment_method_id: paymentDetails.payment_method_id,
            payer_email: paymentDetails.payer?.email,
          });
          
          // Extrai userId do external_reference
          const userMatch = externalReference.match(/USER_([^_]+)/);
          const userId = userMatch ? userMatch[1] : null;

          if (userId && userId !== 'guest') {
            console.log(`[WEBHOOK] Processing payment for user: ${userId}`);
            
            // Busca a transação existente para saber se já foi criada
            const { data: existingTransaction } = await supabase
              .from('transactions')
              .select('id, amount, status')
              .eq('user_id', userId)
              .or(`description.ilike.%Payment ID: ${paymentId}%`)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Se o pagamento foi aprovado, processa
            if (status === 'approved') {
              console.log(`[WEBHOOK] Payment ${paymentId} approved for user ${userId} - Amount: R$ ${transactionAmount}`);
              
              // Garante que o valor seja um número inteiro positivo
              const amountToAdd = Math.max(0, Math.round(transactionAmount * 100) / 100);
              
<<<<<<< HEAD
              // Incrementa o saldo do usuário na tabela profiles usando service_role
              try {
                // Busca o saldo atual
                const { data: currentBalance, error: fetchError } = await supabaseServer
                  .from('profiles')
                  .select('saldo')
                  .eq('id', userId)
                  .maybeSingle();

                if (fetchError) {
                  console.error(`Error fetching balance for user ${userId}:`, fetchError);
                } else {
                  const currentSaldo = Math.round(currentBalance?.saldo || 0);
                  const newSaldo = Math.round(currentSaldo + amountToAdd);

                  // Atualiza o saldo usando service_role (bypass RLS)
                  const { data: balanceData, error: updateError } = await supabaseServer
                    .from('profiles')
                    .upsert({
                      id: userId,
                      saldo: newSaldo,
                      updated_at: new Date().toISOString(),
                    }, {
                      onConflict: 'id'
                    })
                    .select()
                    .single();

                  if (updateError) {
                    console.error(`Error updating balance for user ${userId}:`, updateError);
                  } else {
                    console.log(`Balance incremented successfully for user ${userId}. Previous: ${currentSaldo}, Added: ${amountToAdd}, New: ${balanceData?.saldo}`);
=======
              if (amountToAdd > 0) {
                try {
                  // Incrementa o saldo do usuário
                  const { data: balanceData, error: balanceError } = await incrementUserBalance(
                    userId,
                    amountToAdd
                  );

                  if (balanceError) {
                    console.error(`[WEBHOOK] Error incrementing balance for user ${userId}:`, balanceError);
                    return NextResponse.json({ 
                      received: true, 
                      error: 'Failed to increment balance' 
                    }, { status: 200 });
                  } else {
                    console.log(`[WEBHOOK] ✅ Balance incremented successfully for user ${userId}. New balance: R$ ${balanceData?.saldo}`);
>>>>>>> refs/remotes/origin/master
                  }

                  // Atualiza ou cria a transação no banco
                  if (existingTransaction) {
                    console.log(`[WEBHOOK] Updating existing transaction: ${existingTransaction.id}`);
<<<<<<< HEAD
                    const { error: updateError } = await supabaseServer
=======
                    const { error: updateError } = await supabase
>>>>>>> refs/remotes/origin/master
                      .from('transactions')
                      .update({
                        description: `Pagamento via ${paymentMethod} - Payment ID: ${paymentId} - Status: ${status}`,
                        amount: amountToAdd,
                        payment_method: paymentMethod,
                        status: 'completed',
                      })
                      .eq('id', existingTransaction.id);

                    if (updateError) {
                      console.error(`[WEBHOOK] Error updating transaction:`, updateError);
                    } else {
                      console.log(`[WEBHOOK] ✅ Transaction updated for payment ${paymentId}`);
                    }
                  } else {
                    console.log(`[WEBHOOK] Creating new transaction for payment ${paymentId}`);
                    const { error: createError } = await createTransaction({
                      user_id: userId,
                      amount: amountToAdd,
                      type: 'entrada',
                      description: `Pagamento via ${paymentMethod} - Payment ID: ${paymentId} - Status: ${status}`,
                      payment_method: paymentMethod,
                    });

                    if (createError) {
                      console.error(`[WEBHOOK] Error creating transaction:`, createError);
                    } else {
                      console.log(`[WEBHOOK] ✅ New transaction created for payment ${paymentId}`);
                    }
                  }
<<<<<<< HEAD
                }
              } catch (error) {
                console.warn(`[WEBHOOK] Error processing approved payment for ${paymentId}:`, error);
=======
                } catch (error) {
                  console.error(`[WEBHOOK] Unexpected error processing approved payment:`, error);
                  return NextResponse.json({ 
                    received: true, 
                    error: 'Unexpected error' 
                  }, { status: 200 });
                }
              } else {
                console.warn(`[WEBHOOK] Invalid amount for payment ${paymentId}: ${transactionAmount}`);
>>>>>>> refs/remotes/origin/master
              }
            } else if (status === 'rejected' || status === 'cancelled') {
              console.log(`[WEBHOOK] Payment ${paymentId} ${status} for user ${userId} - Balance not incremented`);
              
              // Atualiza a transação com status rejeitado
              if (existingTransaction) {
                await supabase
                  .from('transactions')
                  .update({
                    status: status === 'rejected' ? 'rejected' : 'cancelled',
                    description: `Pagamento via ${paymentMethod} - Payment ID: ${paymentId} - Status: ${status}`,
                  })
                  .eq('id', existingTransaction.id);
              }
            } else if (status === 'pending' || status === 'in_process') {
              console.log(`[WEBHOOK] Payment ${paymentId} ${status} for user ${userId} - Waiting for approval`);
              
              // Atualiza a transação com status pendente
              if (existingTransaction) {
                await supabase
                  .from('transactions')
                  .update({
                    status: 'pending',
                    description: `Pagamento via ${paymentMethod} - Payment ID: ${paymentId} - Status: ${status}`,
                  })
                  .eq('id', existingTransaction.id);
              }
            }
          } else {
            console.log(`[WEBHOOK] Payment ${paymentId} with no valid user ID or guest user`);
          }
        } else {
          console.log(`[WEBHOOK] Payment details not found for ID: ${paymentId}`);
        }
      } catch (fetchError) {
        console.error(`[WEBHOOK] Error fetching payment details:`, fetchError);
      }
    }

    // Trata notificações de preapproval (assinaturas)
    if (type === 'preapproval' || action === 'preapproval.updated') {
      const preapprovalId = data?.id || body.id;
      
      if (!preapprovalId) {
        console.log('[WEBHOOK] No preapproval ID found in webhook data');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      console.log(`[WEBHOOK] Preapproval notification received: ${preapprovalId}`);
      console.log(`[WEBHOOK] Preapproval status: ${data?.status || 'unknown'}`);
      
      // Aqui você pode adicionar lógica para processar notificações de assinaturas
      // Por exemplo, quando uma cobrança mensal é processada
    }

    // Sempre retorna 200 OK para o Mercado Pago
    console.log(`[WEBHOOK] ✅ Webhook processed successfully`);
    return NextResponse.json({ received: true, processed: true }, { status: 200 });
  } catch (error) {
    console.error('[WEBHOOK] Error processing webhook:', error);
    
    // Sempre retorna sucesso para o Mercado Pago, mesmo com erro interno
    // para evitar reenvios desnecessários
    return NextResponse.json({ 
      received: true, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 200 });
  }
}

