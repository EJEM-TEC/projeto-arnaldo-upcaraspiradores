'use client';

interface BalancePageProps {
    balance: string;
}

export default function BalancePage({ balance }: BalancePageProps) {
    return (
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

            <button className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg uppercase hover:bg-orange-600 transition-colors">
                ADICIONAR CRÉDITO
            </button>
        </div>
    );
}
