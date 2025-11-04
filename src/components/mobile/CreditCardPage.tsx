'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface CardData {
    token?: string;
    cardNumber?: string;
    cvv?: string;
    cardholderName: string;
    month?: number;
    year?: number;
    cpf: string;
}

interface CreditCardPageProps {
    onNext: (data: { amount: string; cardData: CardData }) => void;
}

export default function CreditCardPage({ onNext }: CreditCardPageProps) {
    const [selectedAmount, setSelectedAmount] = useState('5');
    const [cardNumber, setCardNumber] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardholderName, setCardholderName] = useState('');
    const [month, setMonth] = useState(0);
    const [year, setYear] = useState(0);
    const [cpf, setCpf] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const amounts = ['5', '10', '20', '30', '40', '50'];

    const handlePay = async () => {
        if (!cardNumber || !cvv || !cardholderName || month === 0 || year === 0 || !cpf) {
            setError('Por favor, preencha todos os campos');
            return;
        }

        // Valida e limpa o mês
        if (month < 1 || month > 12) {
            setError('Mês de expiração inválido (digite um número entre 1 e 12)');
            return;
        }
        if (year < 2025 || year > 2030) {
            setError('Ano de expiração inválido (digite um ano entre 2025 e 2030)');
            return;
        }

        // Log para debug
        console.log('Frontend - Sending token request:', {
            month: month,
            year: year,
        });

        setLoading(true);
        setError('');

        try {
            // Prepara o body da requisição
            const tokenRequestBody = {
                cardNumber: cardNumber.replace(/\s/g, ''),
                cardholderName,
                cardExpirationMonth: month,
                cardExpirationYear: year,
                securityCode: cvv,
                identificationType: 'CPF',
                identificationNumber: cpf.replace(/\D/g, ''),
            };

            console.log('Frontend - Full token request body:', JSON.stringify(tokenRequestBody, null, 2));

            // Primeiro, cria o token do cartão
            const tokenResponse = await fetch('/api/payment/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tokenRequestBody),
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                throw new Error(tokenData.error || 'Erro ao criar token do cartão');
            }

            // Agora cria o pagamento
            const paymentResponse = await fetch('/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: selectedAmount,
                    paymentMethod: 'credit-card',
                    userId: user?.id,
                    cardToken: tokenData.token,
                    cardNumber: cardNumber.replace(/\s/g, ''), // Envia o número para detectar a bandeira
                    payer: {
                        email: user?.email || '',
                        cpf: cpf.replace(/\D/g, ''),
                    },
                    description: `Adicionar crédito via Cartão - R$ ${selectedAmount}`,
                }),
            });

            const paymentData = await paymentResponse.json();

            if (!paymentResponse.ok) {
                // Monta mensagem de erro mais detalhada
                let errorMessage = paymentData.error || 'Erro ao processar pagamento';
                if (paymentData.details) {
                    errorMessage += `: ${paymentData.details}`;
                }
                throw new Error(errorMessage);
            }

            if (paymentData.status === 'approved') {
                // Pagamento aprovado, pode prosseguir
                const cardData = {
                    cardNumber,
                    cvv,
                    cardholderName,
                    month,
                    year,
                    cpf
                };
                onNext({ amount: selectedAmount, cardData });
            } else {
                throw new Error(`Pagamento ${paymentData.status}. Tente novamente.`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
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
                            className={`w-full h-16 rounded-full font-bold text-lg transition-colors ${selectedAmount === amount
                                ? 'bg-orange-500 text-white'
                                : 'bg-white text-black hover:bg-gray-200'
                                }`}
                        >
                            R$ {amount}
                        </button>
                    ))}
                </div>
            </div>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* Credit Card Form */}
            <div className="space-y-4 mb-8">
                <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="Número do cartão"
                    className="w-full px-4 py-4 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                />

                <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="CVV"
                    className="w-full px-4 py-4 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                />

                <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Titular do cartão"
                    className="w-full px-4 py-4 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                />

                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        value={month}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value === '' || (parseInt(value, 10) >= 1 && parseInt(value, 10) <= 12)) {
                                setMonth(parseInt(value, 10));
                            }
                        }}
                        onBlur={(e) => {
                            const value = e.target.value.replace(/\D/g, '').trim();
                            if (value && parseInt(value, 10) >= 1 && parseInt(value, 10) <= 12) {
                                setMonth(parseInt(value, 10));
                            }
                        }}
                        placeholder="MÊS (01-12)"
                        maxLength={2}
                        className="w-full px-4 py-4 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                    />
                    <input
                        type="text"
                        value={year}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 4 && parseInt(value, 10) >= 2025 && parseInt(value, 10) <= 2030) {
                                setYear(parseInt(value, 10));
                            }
                        }}
                        placeholder="ANO (AAAA)"
                        maxLength={4}
                        className="w-full px-4 py-4 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                    />
                </div>

                <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="CPF do portador"
                    className="w-full px-4 py-4 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                />
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-500 text-white rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Pay Button */}
            <button
                onClick={handlePay}
                disabled={loading}
                className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg uppercase hover:bg-orange-600 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'PROCESSANDO...' : 'PAGAR'}
            </button>

            {/* Secure Purchase Badge */}
            <div className="flex items-center justify-center space-x-2">
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
