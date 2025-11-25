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
          <h2 className="text-2xl font-bold mb-6">Insira o número da máquina abaixo</h2>

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