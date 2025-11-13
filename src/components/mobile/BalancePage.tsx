'use client';

import { useState } from 'react';
import CheckoutProModal from '@/components/CheckoutProModal';

interface BalancePageProps {
    balance: string;
    onAddCredit?: () => void;
}

export default function BalancePage({ balance, onAddCredit }: BalancePageProps) {
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    const handleCheckoutSuccess = () => {
        // Recarrega a página para atualizar o saldo
        window.location.reload();
        onAddCredit?.();
    };

    return (
        <>
            <CheckoutProModal
                isOpen={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                onSuccess={handleCheckoutSuccess}
            />
            <div className="px-4 py-6">
                <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                    MEU SALDO
                </h1>

                <div className="text-center mb-8">
                    <p className="text-white text-4xl font-bold mb-4">
                        R$ {balance}
                    </p>
                    <p className="text-gray-400 text-sm">
                        Saldo atual disponível
                    </p>
                </div>

                <button 
                    onClick={() => setShowCheckoutModal(true)}
                    className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg uppercase hover:bg-orange-600 transition-colors"
                >
                    ADICIONAR CRÉDITO
                </button>
            </div>
        </>
    );
}
