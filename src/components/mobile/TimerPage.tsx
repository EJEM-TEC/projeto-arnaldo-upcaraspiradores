'use client';

import { useState } from 'react';

interface TimerPageProps {
    amount: string;
    onStart: () => void;
}

export default function TimerPage({ amount, onStart }: TimerPageProps) {
    const [selectedTime, setSelectedTime] = useState('');
    const [remainingTime, setRemainingTime] = useState('00:00');

    const timeOptions = [
        { label: '5 min', value: '5', price: 5 },
        { label: '10 min', value: '10', price: 10 },
        { label: '15 min', value: '15', price: 15 },
        { label: '20 min', value: '20', price: 20 },
        { label: '30 min', value: '30', price: 30 },
        { label: '45 min', value: '45', price: 45 },
    ];

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
        setRemainingTime(`${time}:00`);
    };

    const handleStart = () => {
        if (selectedTime) {
            onStart();
        }
    };

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
                    Selecione o tempo
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
                            className={`py-3 rounded-lg font-bold text-lg transition-colors ${selectedTime === option.value
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-800 text-white hover:bg-gray-700'
                                }`}
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
                    PREÇO: R$ {selectedTime ? (parseInt(selectedTime) * 1).toFixed(2).replace('.', ',') : '00,00'}
                </p>
                <p className="text-white text-xl font-bold">
                    MEU SALDO: R$ {amount}
                </p>
            </div>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* Timer Display */}
            <div className="text-center mb-8">
                <h3 className="text-white text-lg font-bold uppercase mb-4">
                    TEMPO RESTANTE:
                </h3>
                <div className="text-white text-6xl font-bold mb-8">
                    {remainingTime}
                </div>
            </div>

            {/* Start Button */}
            <button
                onClick={handleStart}
                disabled={!selectedTime}
                className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg uppercase hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                INICIAR
            </button>
        </div>
    );
}
