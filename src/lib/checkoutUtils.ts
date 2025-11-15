import { User } from '@supabase/supabase-js';

export interface CheckoutProOptions {
  amount: string;
  user: User | null;
  cpf?: string;
  initialBalance?: number; // Saldo inicial antes do pagamento
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Abre o checkout pro do Mercado Pago em um pop-up
 */
export async function openCheckoutPro({
  amount,
  user,
  cpf,
  onSuccess,
  onError,
}: CheckoutProOptions): Promise<void> {
  // Validações
  if (!amount || parseFloat(amount) <= 0) {
    const error = 'Por favor, selecione um valor para adicionar';
    onError?.(error);
    return;
  }

  if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
    const error = 'CPF inválido. Por favor, informe um CPF válido.';
    onError?.(error);
    return;
  }

  if (!user?.email) {
    const error = 'Email do usuário não encontrado';
    onError?.(error);
    return;
  }

  try {
    // Cria a preferência de pagamento (Checkout Pro)
    const response = await fetch('/api/payment/checkout-pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        userId: user?.id,
        payer: {
          email: user.email,
          cpf: cpf.replace(/\D/g, ''),
        },
        description: `Adicionar crédito - R$ ${amount}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar checkout');
    }

    if (!data.initPoint && !data.sandboxInitPoint) {
      throw new Error('URL do checkout não retornada');
    }

    // Usa a URL de produção ou sandbox
    const checkoutUrl = data.initPoint || data.sandboxInitPoint;

    // Abre o checkout em um pop-up
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
      checkoutUrl,
      'MercadoPagoCheckout',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      throw new Error('Não foi possível abrir o pop-up. Verifique se os pop-ups estão bloqueados.');
    }

    // Armazena o externalReference para verificação posterior (pode ser usado para logs/debug)
    // const externalReference = data.externalReference;
    // const preferenceId = data.preferenceId;

    // Função para verificar o status do pagamento
    const checkPaymentStatus = async (): Promise<boolean> => {
      try {
        // Aguarda um pouco para o webhook processar (até 10 segundos com tentativas)
        const maxAttempts = 5;
        const delayMs = 2000;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          
          // Verifica o saldo do usuário para confirmar se o pagamento foi processado
          const balanceResponse = await fetch(`/api/payment/verify-balance?userId=${user.id}`);
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            const currentBalance = balanceData.balance || 0;
            const expectedBalance = parseFloat(amount);
            
            // Se o saldo aumentou pelo valor esperado, o pagamento foi processado
            if (currentBalance >= expectedBalance) {
              console.log(`Payment confirmed: balance increased to ${currentBalance}`);
              return true;
            }
            
            // Se ainda não aumentou, continua tentando
            console.log(`Payment not yet confirmed. Attempt ${attempt + 1}/${maxAttempts}. Current balance: ${currentBalance}, Expected: ${expectedBalance}`);
          }
        }
        
        // Se após todas as tentativas não confirmou, retorna false
        console.warn('Payment status could not be confirmed after multiple attempts');
        return false;
      } catch (error) {
        console.error('Error checking payment status:', error);
        return false;
      }
    };

    // Monitora o fechamento do pop-up
    const checkInterval = setInterval(async () => {
      if (popup.closed) {
        clearInterval(checkInterval);
        
        // Verifica o status do pagamento antes de prosseguir
        const paymentApproved = await checkPaymentStatus();
        
        if (paymentApproved) {
          onSuccess?.();
        } else {
          onError?.('Pagamento não confirmado. Verifique o status do pagamento ou tente novamente.');
        }
      }
    }, 500);

    // Listener para quando o pop-up redireciona de volta (via back_urls)
    const handlePopupMessage = async (event: MessageEvent) => {
      // Verifica se a mensagem é do Mercado Pago
      if (event.origin.includes('mercadopago.com') || event.origin.includes('mercadolivre.com')) {
        if (event.data?.type === 'mp-checkout' || event.data?.status) {
          clearInterval(checkInterval);
          window.removeEventListener('message', handlePopupMessage);
          
          const status = event.data.status;
          
          // Só prossegue se o pagamento foi aprovado
          if (status === 'approved' || status === 'success') {
            // Verifica novamente o status antes de prosseguir
            const paymentApproved = await checkPaymentStatus();
            if (paymentApproved) {
              onSuccess?.();
            } else {
              onError?.('Pagamento aprovado, mas aguardando confirmação. Tente novamente em alguns instantes.');
            }
          } else if (status === 'rejected' || status === 'cancelled' || status === 'failed') {
            onError?.('Pagamento não aprovado. Tente novamente.');
          } else if (status === 'pending' || status === 'in_process') {
            onError?.('Pagamento em processamento. Aguarde a confirmação.');
          } else {
            onError?.('Status do pagamento desconhecido. Verifique o status ou tente novamente.');
          }
        }
      }
    };

    window.addEventListener('message', handlePopupMessage);

    // Timeout de segurança (5 minutos)
    setTimeout(() => {
      if (popup && !popup.closed) {
        popup.close();
      }
      clearInterval(checkInterval);
      window.removeEventListener('message', handlePopupMessage);
    }, 300000);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
    onError?.(errorMessage);
    console.error('Erro no checkout:', err);
  }
}

