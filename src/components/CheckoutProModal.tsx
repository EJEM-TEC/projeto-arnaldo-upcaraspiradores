'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { openCheckoutPro } from '@/lib/checkoutUtils';

interface CheckoutProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CheckoutProModal({ isOpen, onClose, onSuccess }: CheckoutProModalProps) {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState('5');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialBalance, setInitialBalance] = useState<number | undefined>(undefined);
  const amounts = ['5', '10', '20', '30', '40', '50'];

  // Busca o saldo inicial quando o modal é aberto
  useEffect(() => {
    if (isOpen && user?.id) {
      const fetchInitialBalance = async () => {
        try {
          const response = await fetch(`/api/payment/verify-balance?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setInitialBalance(data.balance || 0);
          }
        } catch (error) {
          console.error('Error fetching initial balance:', error);
          setInitialBalance(0);
        }
      };
      fetchInitialBalance();
    }
  }, [isOpen, user?.id]);

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  const handleOpenCheckout = async () => {
    setError('');
    setLoading(true);

    // Busca o saldo atual antes de abrir o checkout
    let currentBalance = initialBalance;
    if (user?.id && currentBalance === undefined) {
      try {
        const response = await fetch(`/api/payment/verify-balance?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          currentBalance = data.balance || 0;
        }
      } catch (error) {
        console.error('Error fetching balance before checkout:', error);
        currentBalance = 0;
      }
    }

    await openCheckoutPro({
      amount: selectedAmount,
      user,
      cpf,
      initialBalance: currentBalance,
      onSuccess: () => {
        setLoading(false);
        setError(''); // Limpa qualquer erro anterior
        onSuccess?.();
        onClose();
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setLoading(false);
        // NÃO fecha o modal em caso de erro - permite que o usuário tente novamente
      },
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-orange-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Title */}
          <h2 className="text-white text-2xl font-bold mb-6 uppercase text-center">
            Adicionar Crédito
          </h2>

          {/* Separator */}
          <div className="w-full h-px bg-orange-500 mb-6"></div>

          {/* Amount Selection */}
          <div className="mb-6">
            <p className="text-white text-sm mb-4 text-center">
              Selecione o valor:
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {amounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amount);
                    setError('');
                  }}
                  disabled={loading}
                  className={`w-full h-14 rounded-full font-bold text-lg transition-colors ${
                    selectedAmount === amount
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-black hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  R$ {amount}
                </button>
              ))}
            </div>

            <p className="text-white text-sm text-center">
              Valor selecionado: <span className="font-bold text-orange-500">R$ {selectedAmount}</span>
            </p>
          </div>

          {/* Separator */}
          <div className="w-full h-px bg-orange-500 mb-6"></div>

          {/* CPF Input */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              CPF
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => {
                const formatted = formatCPF(e.target.value);
                setCpf(formatted);
                setError('');
              }}
              placeholder="000.000.000-00"
              maxLength={14}
              disabled={loading}
              className="w-full h-12 px-4 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500 text-white rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleOpenCheckout}
              disabled={loading}
              className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                loading
                  ? 'bg-gray-500 text-white cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              } disabled:opacity-50`}
            >
              {loading ? 'Abrindo checkout...' : `Pagar R$ ${selectedAmount}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

