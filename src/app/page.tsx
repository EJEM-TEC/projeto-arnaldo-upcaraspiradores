'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function HomePage() {
  const [inputSlug, setInputSlug] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSlug.trim()) {
      // Redireciona para /home/{slug}
      window.location.href = `/home/${encodeURIComponent(inputSlug.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Logo/Header */}
        <div className="text-center mb-12">
          <Image 
            src="/upcar_preto.png" 
            alt="UpCarAspiradores Logo" 
            width={280} 
            height={120}
            priority
            className="mx-auto mb-4"
          />
          <p className="text-gray-400 text-lg">Sistema Inteligente de Aspiração</p>
        </div>

        {/* Main Content */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Como Usar?</h2>

          {/* Instructions */}
          <div className="space-y-6 mb-8">
            <div className="flex gap-4">
              <div className="text-orange-500 text-2xl font-bold">1</div>
              <div>
                <h3 className="font-bold mb-2">Escaneie o QR Code</h3>
                <p className="text-gray-400">
                  Use seu smartphone para escanear o QR code disponível na máquina. Você será direcionado automaticamente.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-orange-500 text-2xl font-bold">2</div>
              <div>
                <h3 className="font-bold mb-2">Ou Digite o Código da Máquina</h3>
                <p className="text-gray-400">
                  Se preferir, digite o código de 6 dígitos da máquina abaixo para acessar.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-orange-500 text-2xl font-bold">3</div>
              <div>
                <h3 className="font-bold mb-2">Controle a Máquina</h3>
                <p className="text-gray-400">
                  Uma vez dentro, você pode ativar a máquina, ver histórico de uso e comprar créditos.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-400 mb-2">
                Código da Máquina (6 dígitos)
              </label>
              <input
                type="text"
                id="slug"
                value={inputSlug}
                onChange={(e) => setInputSlug(e.target.value)}
                placeholder="Ex: 123456"
                maxLength={6}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={!inputSlug.trim() || inputSlug.length !== 6}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Acessar Máquina
            </button>
          </form>

          {/* Examples */}
          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-sm text-gray-500 mb-4">Exemplos de códigos válidos:</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = '/home/123456'}
                className="block w-full px-3 py-2 bg-gray-800 rounded hover:bg-gray-700 transition text-sm text-orange-500 hover:text-orange-400 text-left"
              >
                /home/123456
              </button>
              <button
                onClick={() => window.location.href = '/home/654321'}
                className="block w-full px-3 py-2 bg-gray-800 rounded hover:bg-gray-700 transition text-sm text-orange-500 hover:text-orange-400 text-left"
              >
                /home/654321
              </button>
              <button
                onClick={() => window.location.href = '/home/999999'}
                className="block w-full px-3 py-2 bg-gray-800 rounded hover:bg-gray-700 transition text-sm text-orange-500 hover:text-orange-400 text-left"
              >
                /home/999999
              </button>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            Problema ao acessar? Entre em contato com{' '}
            <a href="mailto:arnaldfirst@gmail.com" className="text-orange-500 hover:text-orange-400">
              arnaldfirst@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}