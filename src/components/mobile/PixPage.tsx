'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PixPageProps {
    onNext: (data: { amount: string; cpf: string; pixCode?: string; qrCode?: string }) => void;
}

export default function PixPage({ onNext }: PixPageProps) {
    const [selectedAmount, setSelectedAmount] = useState('5');
    const [cpf, setCpf] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const amounts = ['5', '10', '20', '30', '40', '50'];

    const handleGenerateCode = async () => {
        if (!cpf.trim()) {
            setError('Por favor, informe o CPF');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: selectedAmount,
                    paymentMethod: 'pix',
                    userId: user?.id,
                    payer: {
                        email: user?.email || '',
                        cpf: cpf.replace(/\D/g, ''),
                    },
                    description: `Adicionar crédito via PIX - R$ ${selectedAmount}`,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar pagamento');
            }

            onNext({
                amount: selectedAmount,
                cpf,
                pixCode: data.pixCode || data.pixQrCode,
                qrCode: data.pixQrCode || data.pixCode,
            });
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
                PIX
            </h1>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* Amount Selection */}
            <div className="mb-8">
                <p className="text-white text-lg mb-6 text-center">
                    Quanto deseja adicionar?
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    {amounts.map((amount) => (
                        <button
                            key={amount}
                            onClick={() => setSelectedAmount(amount)}
                            className={`w-full h-16 rounded-md font-bold text-lg transition-colors ${selectedAmount === amount
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

            {/* CPF Input */}
            <div className="mb-8">
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

            {/* Generate Code Button */}
            <button
                onClick={handleGenerateCode}
                disabled={!cpf.trim() || loading}
                className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg uppercase hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'GERANDO CÓDIGO...' : 'GERAR CÓDIGO'}
            </button>
        </div>
    );
}
