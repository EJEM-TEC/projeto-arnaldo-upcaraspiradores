'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface MonthlyPageProps {
    onNext: (data: { amount: string }) => void;
}

export default function MonthlyPage({ onNext }: MonthlyPageProps) {
    const [monthlyPrice, setMonthlyPrice] = useState<string>('5');
    const [loadingPrice, setLoadingPrice] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cpf, setCpf] = useState('');
    const { user } = useAuth();
    const popupIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const popupRef = useRef<Window | null>(null);

    // Função para formatar CPF
    const formatCPF = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
        if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
        return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
    };

    // Carregar preço mensalista ao montar o componente
    useEffect(() => {
        const fetchMonthlyPrice = async () => {
            setLoadingPrice(true);
            try {
                const response = await fetch('/api/admin/monthly-price');
                if (response.ok) {
                    const data = await response.json();
                    setMonthlyPrice(data.price?.toString() || '5');
                } else {
                    console.error('Erro ao buscar preço mensalista');
                    setMonthlyPrice('5');
                }
            } catch (error) {
                console.error('Erro ao buscar preço mensalista:', error);
                setMonthlyPrice('5');
            } finally {
                setLoadingPrice(false);
            }
        };
        fetchMonthlyPrice();
    }, []);

    const today = new Date();
    const day = today.getDate();

    // Função para abrir o checkout-pro em pop-up (para assinatura mensal)
    const handleCheckoutPro = async () => {
        setError('');

        // Validações
        if (!monthlyPrice || parseFloat(monthlyPrice) <= 0) {
            setError('Preço mensalista não configurado');
            return;
        }

        if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
            setError('CPF inválido');
            return;
        }

        if (!user?.email) {
            setError('Email do usuário não encontrado');
            return;
        }

        setLoading(true);

        try {
            // Cria a preferência de pagamento (Checkout Pro) para assinatura mensal
            const response = await fetch('/api/payment/checkout-pro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: monthlyPrice,
                    userId: user?.id,
                    payer: {
                        email: user.email,
                        cpf: cpf.replace(/\D/g, ''),
                    },
                    description: `Assinatura mensal - R$ ${monthlyPrice} (Dia ${day})`,
                    isSubscription: true, // Flag para indicar que é assinatura
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

            popupRef.current = popup;

            // Limpa intervalos anteriores se existirem
            if (popupIntervalRef.current) {
                clearInterval(popupIntervalRef.current);
            }
            if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
            }

            // Monitora o fechamento do pop-up e verifica o status do pagamento
            popupIntervalRef.current = setInterval(() => {
                if (popup.closed) {
                    if (popupIntervalRef.current) {
                        clearInterval(popupIntervalRef.current);
                        popupIntervalRef.current = null;
                    }
                    setLoading(false);

                    // Aguarda um pouco para o webhook processar
                    setTimeout(() => {
                        // O webhook processará o pagamento e atualizará o banco de dados
                        onNext({
                            amount: monthlyPrice,
                        });
                    }, 2000);
                }
            }, 500);

            // Listener para quando o pop-up redireciona de volta (via back_urls)
            const handlePopupMessage = (event: MessageEvent) => {
                // Verifica se a mensagem é do Mercado Pago
                if (event.origin.includes('mercadopago.com') || event.origin.includes('mercadolivre.com')) {
                    if (event.data?.type === 'mp-checkout' || event.data?.status) {
                        if (popupIntervalRef.current) {
                            clearInterval(popupIntervalRef.current);
                            popupIntervalRef.current = null;
                        }
                        setLoading(false);

                        if (event.data.status === 'approved' || event.data.status === 'success') {
                            onNext({
                                amount: monthlyPrice,
                            });
                        } else {
                            setError('Pagamento não aprovado. Tente novamente.');
                        }
                        window.removeEventListener('message', handlePopupMessage);
                    }
                }
            };

            window.addEventListener('message', handlePopupMessage);

            // Timeout de segurança (5 minutos)
            popupTimeoutRef.current = setTimeout(() => {
                if (popup && !popup.closed) {
                    popup.close();
                }
                if (popupIntervalRef.current) {
                    clearInterval(popupIntervalRef.current);
                    popupIntervalRef.current = null;
                }
                window.removeEventListener('message', handlePopupMessage);
                setLoading(false);
            }, 300000);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
            setError(errorMessage);
            console.error('Erro no checkout:', err);
            setLoading(false);
        }
    };

    // Limpa intervalos quando o componente desmonta
    useEffect(() => {
        return () => {
            if (popupIntervalRef.current) {
                clearInterval(popupIntervalRef.current);
            }
            if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
            }
            if (popupRef.current && !popupRef.current.closed) {
                popupRef.current.close();
            }
        };
    }, []);

    return (
        <div className="px-4 py-6">
            {/* Page Title */}
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                CRÉDITO MENSALISTA
            </h1>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* Texto de instrução */}
            <div className="mb-8">
                <p className="text-white text-lg mb-6 text-center font-semibold">
                    Assine o mensalista da UpCar e ganhe saldo mensalmente!
                </p>
            </div>

            {/* Valor da assinatura */}
            <div className="mb-8">
                {loadingPrice ? (
                    <div className="text-center">
                        <p className="text-white text-sm">Carregando preço...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg p-6 mb-6">
                        <p className="text-gray-600 text-center text-sm mb-2">Valor da Assinatura Mensal</p>
                        <p className="text-gray-900 text-center text-3xl font-bold">
                            R$ {parseFloat(monthlyPrice).toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                )}
            </div>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* Informações do Checkout Pro */}
            <div className="mb-6">
                <p className="text-white text-sm mb-2 text-center font-semibold">
                    Assinatura Mensal - Dia {day}
                </p>
                <p className="text-white text-sm mb-4 text-center text-gray-300">
                    Você será redirecionado para o checkout seguro do Mercado Pago para finalizar o pagamento.
                </p>
            </div>

            {/* CPF */}
            <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-2">
                    CPF
                </label>
                <input
                    type="text"
                    value={cpf}
                    onChange={(e) => {
                        const formatted = formatCPF(e.target.value);
                        setCpf(formatted);
                        setError('');
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    disabled={loading}
                    className="w-full h-12 px-4 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                    required
                />
            </div>

            {/* Mensagem de Erro */}
            {error && (
                <div className="mt-4 p-4 bg-red-500 text-white rounded-lg text-sm mb-4">
                    {error}
                </div>
            )}

            {/* Botão de Assinar */}
            <button
                type="button"
                onClick={handleCheckoutPro}
                disabled={loading || loadingPrice}
                className={`w-full h-14 rounded-full font-bold text-lg transition-colors mt-6 ${loading || loadingPrice
                    ? 'bg-gray-500 text-white cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                    } disabled:opacity-50`}
            >
                {loading ? 'Abrindo checkout...' : loadingPrice ? 'Carregando...' : 'ASSINAR'}
            </button>

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
