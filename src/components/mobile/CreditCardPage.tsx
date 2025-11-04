'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
// 1. Importe o SDK do React
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import type { ComponentProps } from 'react';

type PaymentFormData = Parameters<NonNullable<ComponentProps<typeof Payment>['onSubmit']>>[0];
type PaymentError = Parameters<NonNullable<ComponentProps<typeof Payment>['onError']>>[0];

// 2. Inicialize o Mercado Pago com sua Chave PÚBLICA
// (Isso deve ser feito fora do componente)
initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? '', {
    locale: 'pt-BR'
});

export interface CardData {
    // Esta interface não é mais necessária para o pagamento,
    // mas você pode mantê-la se 'onNext' precisar dela por algum motivo.
    // O ideal é não armazenar/passar esses dados.
    token?: string;
    cardNumber?: string;
    cvv?: string;
    cardholderName: string;
    month?: number;
    year?: number;
    cpf: string;
}

interface CreditCardPageProps {
    onNext: (data: { amount: string; cardData?: CardData }) => void;
}

export default function CreditCardPage({ onNext }: CreditCardPageProps) {
    const [selectedAmount, setSelectedAmount] = useState('5');
    const [loading, setLoading] = useState(false); // Usaremos este para desabilitar os botões de valor
    const [error, setError] = useState('');
    const { user } = useAuth();
    const amounts = ['5', '10', '20', '30', '40', '50'];

    // 3. Esta é a ÚNICA função que precisamos
    // Ela será chamada pelo Brick DEPOIS que o token for criado com sucesso.
    const handlePaymentSubmit = async (formData: PaymentFormData) => {
        setLoading(true);
        setError('');

        try {
            // 4. Fazemos APENAS UMA chamada para o nosso backend
            // (Note o endpoint: /api/payment/create, como o seu)
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData, // O Brick já nos dá: token, payment_method_id, issuer_id
                    amount: selectedAmount,
                    userId: user?.id,
                    payer: {
                        email: user?.email || '', // O Brick pode coletar o email, mas é bom garantir
                        // O Brick já coleta o CPF e o inclui no formData se configurado
                    },
                    description: `Adicionar crédito - R$ ${selectedAmount}`,
                }),
            });

            const paymentData = await response.json();

            if (!response.ok) {
                let errorMessage = paymentData.error || 'Erro ao processar pagamento';
                if (paymentData.details) {
                    errorMessage += `: ${paymentData.details}`;
                }
                throw new Error(errorMessage);
            }

            if (paymentData.status === 'approved') {
                // Pagamento aprovado!
                onNext({ amount: selectedAmount }); // Passa para a próxima etapa
            } else {
                // Pagamento recusado ou pendente
                throw new Error(`Pagamento ${paymentData.status}. Tente novamente.`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Callback para erros internos do Brick (ex: cartão inválido)
    const handleOnError = (error: PaymentError) => {
        setError("Verifique os dados do cartão. " + error.message);
    };

    return (
        <div className="px-4 py-6">
            {/* Page Title */}
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                CARTÃO DE CRÉDITO
            </h1>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* Amount Selection */}
            <div className="mb-8">
                <p className="text-white text-lg mb-6 text-center">
                    Selecione abaixo o quanto gostaria de adicionar:
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    {amounts.map((amount) => (
                        <button
                            key={amount}
                            onClick={() => setSelectedAmount(amount)}
                            disabled={loading} // Desabilita enquanto processa
                            className={`w-full h-16 rounded-full font-bold text-lg transition-colors ${selectedAmount === amount
                                ? 'bg-orange-500 text-white'
                                : 'bg-white text-black hover:bg-gray-200'
                                } disabled:opacity-50`}
                        >
                            R$ {amount}
                        </button>
                    ))}
                </div>
            </div>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* 5. REMOVA todo o formulário manual antigo. */}
            {/* Substitua por este ÚNICO componente: */}

            {/* O 'key' é importante para forçar o Brick a recarregar se o valor mudar */}
            <Payment
                key={selectedAmount}
                initialization={{
                    amount: parseFloat(selectedAmount),
                    // Você pode pré-preencher o email e CPF do usuário logado
                    payer: {
                        email: user?.email || '',
                        // O Brick vai pedir o CPF se não for fornecido
                    },
                }}
                customization={{
                    // Permite que o Brick aceite Cartões de Crédito
                    paymentMethods: {
                        creditCard: 'all',
                    },
                    visual: {
                        // Faz o Brick combinar com seu tema escuro
                        style: {
                            theme: 'dark'
                        }
                    }
                }}
                onSubmit={handlePaymentSubmit}
                onError={handleOnError}
            />

            {error && (
                <div className="mt-4 p-4 bg-red-500 text-white rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* 6. REMOVA o botão "PAGAR" manual. 
              O componente <Payment> renderiza seu próprio botão "Pagar" 
              que é seguro e só ativa 'onSubmit' quando tudo está válido. 
            */}

            {/* Secure Purchase Badge */}
            <div className="flex items-center justify-center space-x-2 mt-8">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
                <div className="text-center">
                    <span className="text-gray-400 font-bold uppercase">COMPRA</span>
                    <br />
                    <span className="text-orange-500 font-bold uppercase">SEGURA</span>
                </div>
            </div>
        </div>
    );
}
