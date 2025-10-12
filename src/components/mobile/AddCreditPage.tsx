'use client';

import { useState } from 'react';

interface AddCreditPageProps {
    onPaymentSelect: (method: string) => void;
}

export default function AddCreditPage({ onPaymentSelect }: AddCreditPageProps) {
    const [selectedPayment, setSelectedPayment] = useState<string>('');

    const handlePaymentSelect = (method: string) => {
        setSelectedPayment(method);
        onPaymentSelect(method);
    };

    return (
        <div className="px-4 py-6">
            {/* Page Title */}
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                ADICIONAR CRÉDITO
            </h1>

            {/* Information Section */}
            <div className="mb-8">
                {/* Attention Message */}
                <div className="mb-6">
                    <p className="text-white text-sm mb-2">
                        <span className="font-bold">ATENÇÃO:</span> Os valores são válidos apenas para os equipamentos desse estabelecimento.
                    </p>
                </div>

                {/* Pricing Information */}
                <div className="mb-8">
                    <p className="text-white text-sm mb-2">
                        Preço da aspiração por minuto:
                    </p>
                    <p className="text-white text-3xl font-bold">
                        R$ 1,00
                    </p>
                </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-4 mb-8">
                <button
                    onClick={() => handlePaymentSelect('credit-card')}
                    className={`w-full py-4 rounded-lg font-bold text-lg uppercase transition-colors ${selectedPayment === 'credit-card'
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                >
                    CARTÃO DE CRÉDITO
                </button>

                <button
                    onClick={() => handlePaymentSelect('pix')}
                    className={`w-full py-4 rounded-lg font-bold text-lg uppercase transition-colors ${selectedPayment === 'pix'
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                >
                    PIX
                </button>

                <button
                    onClick={() => handlePaymentSelect('monthly')}
                    className={`w-full py-4 rounded-lg font-bold text-lg uppercase transition-colors ${selectedPayment === 'monthly'
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                >
                    MENSALISTA
                </button>
            </div>

            {/* Bottom Separator */}
            <div className="w-full h-px bg-orange-500"></div>
        </div>
    );
}
