'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface WelcomePageProps {
    onClose?: () => void;
    autoCloseDelay?: number; // em milisegundos
}

export default function WelcomePage({ onClose, autoCloseDelay = 5000 }: WelcomePageProps) {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose?.();
        }, 300);
    };

    useEffect(() => {
        if (autoCloseDelay > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, autoCloseDelay);
            return () => clearTimeout(timer);
        }
    }, [autoCloseDelay, handleClose]);

    return (
        <div
            className={`fixed inset-0 bg-black flex items-center justify-center z-50 transition-opacity duration-300 ${
                isClosing ? 'opacity-0' : 'opacity-100'
            }`}
        >
            {/* Content */}
            <div className="w-full max-w-md px-6 text-center">
                {/* Logo */}
                <div className="mb-8">
                    <Image
                        src="/upcar_preto_menor.png"
                        alt="UpCarAspiradores Logo"
                        width={200}
                        height={100}
                        className="mx-auto"
                        priority
                    />
                </div>

                {/* Title */}
                <h1 className="text-white text-4xl font-bold mb-4 uppercase">
                    Bem-vindo!
                </h1>

                {/* Subtitle */}
                <p className="text-orange-500 text-xl font-bold mb-6">
                    UpCar Aspiradores Inteligentes
                </p>

                {/* Description */}
                <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-orange-500">
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Bem-vindo à plataforma de aspiradores inteligentes mais avançada do mercado.
                        Com apenas alguns cliques, você pode ativar nossos equipamentos premium e manter seu veículo impecável.
                    </p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-center space-x-3">
                        <span className="text-orange-500 text-2xl">✓</span>
                        <span className="text-gray-300">Tecnologia de ponta</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                        <span className="text-orange-500 text-2xl">✓</span>
                        <span className="text-gray-300">Serviço 24/7</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                        <span className="text-orange-500 text-2xl">✓</span>
                        <span className="text-gray-300">Múltiplas formas de pagamento</span>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg uppercase hover:bg-orange-600 transition-colors"
                >
                    COMEÇAR AGORA
                </button>

                {/* Progress Bar */}
                <div className="mt-8">
                    <div className="bg-gray-700 h-1 rounded-full overflow-hidden">
                        <div
                            className="bg-orange-500 h-full rounded-full"
                            style={{
                                animation: `progress ${(autoCloseDelay || 5000) / 1000}s linear forwards`,
                            }}
                        />
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                        Fechará automaticamente em alguns segundos...
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes progress {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
            `}</style>
        </div>
    );
}
