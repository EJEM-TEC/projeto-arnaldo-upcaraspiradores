'use client';

import { useState } from 'react';

interface TimerPageProps {
    amount: string;
    onStart: (durationMinutes: number, machineSlug?: string) => void;
    machineSlug?: string;
}

export default function TimerPage({ amount, onStart, machineSlug }: TimerPageProps) {
    const [selectedTime, setSelectedTime] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const timeOptions = [
        { label: '5 min', value: '5', price: 5 },
        { label: '6 min', value: '6', price: 6 },
        { label: '7 min', value: '7', price: 7 },
        { label: '8 min', value: '8', price: 8 },
        { label: '9 min', value: '9', price: 9 },
        { label: '10 min', value: '10', price: 10 },
    ];

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
    };

    const handleStart = async () => {
        if (selectedTime) {
            setIsLoading(true);
            const durationMinutes = parseInt(selectedTime);
            await onStart(durationMinutes, machineSlug);
            // isLoading will be reset when timer starts
        }
    };

    const pricePerMinute = 1;
    const selectedPrice = selectedTime ? (parseInt(selectedTime) * pricePerMinute) : 0;
    const balanceNumber = parseFloat(amount.replace(',', '.'));
    const hasEnoughBalance = balanceNumber >= selectedPrice;

    return (
        <div className="px-4 py-6">
            {/* Page Title */}
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                TEMPO
            </h1>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* Time Selection */}
            <div className="mb-8">
                <h2 className="text-white text-lg font-bold text-center mb-6 uppercase">
                    INFORME ABAIXO O TEMPO DESEJADO
                </h2>

                <button className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg uppercase hover:bg-orange-600 transition-colors mb-6 flex items-center justify-center">
                    {selectedTime ? `${selectedTime} minutos selecionados` : 'Selecione o tempo'}
                    <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                {/* Time Options */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {timeOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleTimeSelect(option.value)}
                            disabled={isLoading}
                            className={`py-3 rounded-lg font-bold text-lg transition-colors ${selectedTime === option.value
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-800 text-white hover:bg-gray-700'
                                } disabled:opacity-50`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* Price and Balance */}
            <div className="text-center mb-8">
                <p className="text-white text-xl font-bold mb-2">
                    PREÇO: R$ {selectedPrice.toFixed(2).replace('.', ',')}
                </p>
                <p className={`text-xl font-bold ${hasEnoughBalance ? 'text-white' : 'text-red-500'}`}>
                    MEU SALDO: R$ {amount}
                </p>
                {!hasEnoughBalance && selectedTime && (
                    <p className="text-red-500 text-sm mt-2">
                        Saldo insuficiente! Faltam R$ {(selectedPrice - balanceNumber).toFixed(2).replace('.', ',')}
                    </p>
                )}
            </div>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* Info */}
            <div className="text-center mb-8 text-gray-400 text-sm">
                <p>O tempo será debitado de seu saldo</p>
                <p>A máquina será desativada automaticamente ao término</p>
            </div>

            {/* Start Button */}
            <button
                onClick={handleStart}
                disabled={!selectedTime || !hasEnoughBalance || isLoading}
                className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg uppercase hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'ATIVANDO MÁQUINA...' : 'INICIAR'}
            </button>
        </div>
    );
}
