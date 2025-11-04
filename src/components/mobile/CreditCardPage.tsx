'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface CardData {
    token?: string;
    cardNumber?: string;
    cvv?: string;
    cardholderName: string;
    month?: string;
    year?: string;
    cpf: string;
}

interface CreditCardPageProps {
    onNext: (data: { amount: string; cardData?: CardData }) => void;
}

export default function CreditCardPage({ onNext }: CreditCardPageProps) {
    const [selectedAmount, setSelectedAmount] = useState('5');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const amounts = ['5', '10', '20', '30', '40', '50'];

    // Estado do formulário
    const [formData, setFormData] = useState({
        cardNumber: '',
        cardholderName: '',
        expirationMonth: '',
        expirationYear: '',
        cvv: '',
        cpf: '',
    });

    // Função para formatar o número do cartão (adiciona espaços a cada 4 dígitos)
    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        return formatted.substring(0, 19); // Limita a 16 dígitos + 3 espaços
    };

    // Função para formatar CPF
    const formatCPF = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
        if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
        return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
    };

    // Função para validar o formulário
    const validateForm = () => {
        if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) {
            setError('Número do cartão inválido');
            return false;
        }
        if (!formData.cardholderName || formData.cardholderName.length < 3) {
            setError('Nome do portador inválido');
            return false;
        }
        // Valida mês de expiração
        if (!formData.expirationMonth || formData.expirationMonth.trim() === '') {
            setError('Mês de validade é obrigatório');
            return false;
        }
        const month = parseInt(formData.expirationMonth, 10);
        if (isNaN(month) || month < 1 || month > 12) {
            setError('Mês de validade inválido. Deve ser entre 01 e 12.');
            return false;
        }
        // Valida ano de expiração
        if (!formData.expirationYear || formData.expirationYear.trim() === '') {
            setError('Ano de validade é obrigatório');
            return false;
        }
        const yearInput = formData.expirationYear.trim();
        const currentYear = new Date().getFullYear() % 100;
        let year: number;
        if (yearInput.length === 2) {
            year = parseInt(yearInput, 10);
            if (isNaN(year) || year < currentYear) {
                setError('Ano de validade inválido ou expirado');
                return false;
            }
        } else if (yearInput.length === 4) {
            year = parseInt(yearInput, 10) % 100;
            if (isNaN(year) || year < currentYear) {
                setError('Ano de validade inválido ou expirado');
                return false;
            }
        } else {
            setError('Ano de validade inválido. Use 2 ou 4 dígitos.');
            return false;
        }
        if (!formData.cvv || formData.cvv.length < 3) {
            setError('CVV inválido');
            return false;
        }
        if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
            setError('CPF inválido');
            return false;
        }
        return true;
    };

    // Função para processar o pagamento
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        // Verifica se o valor foi selecionado
        if (!selectedAmount || parseFloat(selectedAmount) <= 0) {
            setError('Por favor, selecione um valor para adicionar');
            return;
        }

        setLoading(true);

        try {
            // Verifica se os campos não estão vazios antes de processar
            if (!formData.expirationMonth || formData.expirationMonth.trim() === '') {
                throw new Error('Mês de validade é obrigatório');
            }
            if (!formData.expirationYear || formData.expirationYear.trim() === '') {
                throw new Error('Ano de validade é obrigatório');
            }

            // Valida e formata o mês de expiração (garante que seja string com 2 dígitos)
            const monthNum = parseInt(formData.expirationMonth.trim(), 10);
            if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                throw new Error('Mês de validade inválido. Deve ser entre 01 e 12.');
            }
            const formattedMonth = String(monthNum).padStart(2, '0');

            // Valida e formata o ano de expiração (garante que seja string com 4 dígitos)
            let formattedYear: string;
            const yearInput = formData.expirationYear.trim();
            if (yearInput.length === 2) {
                formattedYear = `20${yearInput}`;
            } else if (yearInput.length === 4) {
                formattedYear = yearInput;
            } else {
                throw new Error('Ano de validade inválido. Use 2 ou 4 dígitos.');
            }

            // Verificação final antes de enviar
            if (!formattedMonth || formattedMonth.length !== 2) {
                throw new Error('Erro ao formatar mês de validade');
            }
            if (!formattedYear || formattedYear.length !== 4) {
                throw new Error('Erro ao formatar ano de validade');
            }

            // Log para debug
            console.log('Enviando para tokenização:', {
                cardNumber: formData.cardNumber.replace(/\s/g, '').substring(0, 4) + '...',
                cardholderName: formData.cardholderName,
                cardExpirationMonth: formattedMonth,
                cardExpirationYear: formattedYear,
                securityCode: '***',
                identificationNumber: formData.cpf.replace(/\D/g, '').substring(0, 3) + '...',
            });

            // Passo 1: Tokenizar o cartão
            const tokenResponse = await fetch('/api/payment/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cardNumber: formData.cardNumber.replace(/\s/g, ''),
                    cardholderName: formData.cardholderName,
                    cardExpirationMonth: formattedMonth, // String com 2 dígitos: "01" a "12"
                    cardExpirationYear: formattedYear, // String com 4 dígitos: "2025"
                    securityCode: formData.cvv,
                    identificationType: 'CPF',
                    identificationNumber: formData.cpf.replace(/\D/g, ''),
                }),
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                throw new Error(tokenData.error || tokenData.details || 'Erro ao tokenizar o cartão');
            }

            if (!tokenData.token) {
                throw new Error('Token não retornado pelo servidor');
            }

            // Passo 2: Criar o pagamento com o token
            const paymentResponse = await fetch('/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentMethod: 'credit-card',
                    amount: selectedAmount, // Usando o valor selecionado dos botões
                    cardToken: tokenData.token,
                    cardNumber: formData.cardNumber.replace(/\s/g, ''), // Necessário para detectar a bandeira
                    userId: user?.id,
                    payer: {
                        email: user?.email || '',
                        cpf: formData.cpf.replace(/\D/g, ''),
                    },
                    description: `Adicionar crédito - R$ ${selectedAmount}`,
                }),
            });

            // Verifica se a resposta foi bem-sucedida ANTES de tentar fazer parse do JSON
            let paymentData;
            const responseText = await paymentResponse.text();

            try {
                paymentData = JSON.parse(responseText);
            } catch (_jsonError) {
                // Se não conseguir fazer parse do JSON, mostra o texto da resposta
                console.error('Erro ao fazer parse da resposta JSON. Texto recebido:', responseText);
                throw new Error(`Erro ao processar resposta do servidor: ${responseText.substring(0, 200)}`);
            }

            if (!paymentResponse.ok) {
                // Log detalhado do erro para debug
                console.error('Erro no pagamento - Status:', paymentResponse.status);
                console.error('Erro no pagamento - Dados:', paymentData);

                // Tenta extrair a mensagem de erro de forma mais completa
                let errorMessage = 'Erro ao processar pagamento';

                if (paymentData.error) {
                    errorMessage = paymentData.error;
                } else if (paymentData.details) {
                    errorMessage = paymentData.details;
                } else if (paymentData.message) {
                    errorMessage = paymentData.message;
                } else if (typeof paymentData === 'string') {
                    errorMessage = paymentData;
                }

                // Adiciona detalhes adicionais se disponíveis
                if (paymentData.fullError && process.env.NODE_ENV === 'development') {
                    console.error('Erro completo:', paymentData.fullError);
                }

                throw new Error(errorMessage);
            }

            if (paymentData.status === 'approved') {
                // Pagamento aprovado!
                onNext({
                    amount: selectedAmount,
                    cardData: {
                        token: tokenData.token,
                        cardNumber: formData.cardNumber,
                        cvv: formData.cvv,
                        cardholderName: formData.cardholderName,
                        month: formattedMonth,
                        year: formattedYear,
                        cpf: formData.cpf,
                    }
                });
            } else {
                throw new Error(`Pagamento ${paymentData.status}. Tente novamente.`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
            setError(errorMessage);
            console.error('Erro no pagamento:', err);
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

                <div className="grid grid-cols-3 gap-4 mb-4">
                    {amounts.map((amount) => (
                        <button
                            key={amount}
                            type="button"
                            onClick={() => {
                                setSelectedAmount(amount);
                                setError(''); // Limpa erro ao mudar valor
                            }}
                            disabled={loading}
                            className={`w-full h-16 rounded-full font-bold text-lg transition-colors ${selectedAmount === amount
                                ? 'bg-orange-500 text-white'
                                : 'bg-white text-black hover:bg-gray-200'
                                } disabled:opacity-50`}
                        >
                            R$ {amount}
                        </button>
                    ))}
                </div>

                {/* Mostra o valor selecionado para debug */}
                <p className="text-white text-sm text-center mt-2">
                    Valor selecionado: <span className="font-bold text-orange-500">R$ {selectedAmount}</span>
                </p>
            </div>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* Formulário de Cartão */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Número do Cartão */}
                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        Número do Cartão
                    </label>
                    <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value);
                            setFormData({ ...formData, cardNumber: formatted });
                            setError('');
                        }}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        disabled={loading}
                        className="w-full h-12 px-4 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                        required
                    />
                </div>

                {/* Nome do Portador */}
                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        Nome do Portador
                    </label>
                    <input
                        type="text"
                        value={formData.cardholderName}
                        onChange={(e) => {
                            setFormData({ ...formData, cardholderName: e.target.value.toUpperCase() });
                            setError('');
                        }}
                        placeholder="NOME COMO NO CARTÃO"
                        disabled={loading}
                        className="w-full h-12 px-4 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                        required
                    />
                </div>

                {/* Validade e CVV */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">
                            Mês
                        </label>
                        <input
                            type="text"
                            value={formData.expirationMonth}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').substring(0, 2);
                                // Aceita qualquer valor enquanto digita (validação completa no submit)
                                setFormData({ ...formData, expirationMonth: value });
                                setError('');
                            }}
                            placeholder="MM"
                            maxLength={2}
                            disabled={loading}
                            className="w-full h-12 px-4 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">
                            Ano
                        </label>
                        <input
                            type="text"
                            value={formData.expirationYear}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').substring(0, 2);
                                setFormData({ ...formData, expirationYear: value });
                                setError('');
                            }}
                            placeholder="AA"
                            maxLength={2}
                            disabled={loading}
                            className="w-full h-12 px-4 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">
                            CVV
                        </label>
                        <input
                            type="text"
                            value={formData.cvv}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').substring(0, 4);
                                setFormData({ ...formData, cvv: value });
                                setError('');
                            }}
                            placeholder="123"
                            maxLength={4}
                            disabled={loading}
                            className="w-full h-12 px-4 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                            required
                        />
                    </div>
                </div>

                {/* CPF */}
                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        CPF
                    </label>
                    <input
                        type="text"
                        value={formData.cpf}
                        onChange={(e) => {
                            const formatted = formatCPF(e.target.value);
                            setFormData({ ...formData, cpf: formatted });
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
                    <div className="mt-4 p-4 bg-red-500 text-white rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Botão de Pagar */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full h-14 rounded-full font-bold text-lg transition-colors mt-6 ${loading
                        ? 'bg-gray-500 text-white cursor-not-allowed'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                        } disabled:opacity-50`}
                >
                    {loading ? 'Processando...' : `PAGAR R$ ${selectedAmount}`}
                </button>
            </form>

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
