'use client';

import { useState } from 'react';

interface PixCodePageProps {
    amount: string;
    cpf: string;
    pixCode?: string;
    qrCode?: string;
    onCopyCode: () => void;
}

export default function PixCodePage({ amount, pixCode, qrCode, onCopyCode }: PixCodePageProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (pixCode) {
            try {
                await navigator.clipboard.writeText(pixCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Erro ao copiar código:', err);
            }
        }
        onCopyCode();
    };
    return (
        <div className="px-4 py-6">
            {/* Page Title */}
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                QUASE LÁ!
            </h1>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

            {/* PIX Logo Box */}
            <div className="bg-white rounded-lg p-8 mb-8">
                <div className="flex flex-col items-center space-y-4">
                    {/* QR Code */}
                    {qrCode && (
                        <img 
                            src={`data:image/png;base64,${qrCode}`} 
                            alt="QR Code PIX" 
                            className="w-48 h-48 border-2 border-gray-300 rounded-lg"
                        />
                    )}
                    
                    {/* PIX Logo */}
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-gray-600 text-2xl font-bold">pix</div>
                            <div className="text-gray-400 text-sm">powered by Banco Central</div>
                        </div>
                    </div>

                    {/* PIX Code */}
                    {pixCode && (
                        <div className="w-full mt-4 p-4 bg-gray-100 rounded-lg">
                            <p className="text-xs text-gray-500 mb-2">Código PIX:</p>
                            <p className="text-sm font-mono break-all text-gray-800">{pixCode}</p>
                        </div>
                    )}

                    <p className="text-gray-600 text-center mt-4">
                        Valor: <span className="font-bold text-lg">R$ {amount}</span>
                    </p>
                </div>
            </div>

            {/* Copy Code Button */}
            <button
                onClick={handleCopy}
                className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg uppercase hover:bg-orange-600 transition-colors mb-8"
            >
                {copied ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO'}
            </button>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500 mb-8"></div>

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
