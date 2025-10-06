'use client'

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface MudarSenhaFormProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function MudarSenhaForm({ 
  className = '',
  onSuccess,
  onError
}: MudarSenhaFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { user } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    if (message) {
      setMessage('');
      setMessageType(null);
    }
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      return 'Senha atual é obrigatória';
    }
    if (!formData.newPassword) {
      return 'Nova senha é obrigatória';
    }
    if (formData.newPassword.length < 6) {
      return 'Nova senha deve ter pelo menos 6 caracteres';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      return 'Nova senha e confirmação não coincidem';
    }
    if (formData.currentPassword === formData.newPassword) {
      return 'A nova senha deve ser diferente da senha atual';
    }
    return null;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      const errorMsg = 'Usuário não autenticado';
      setMessage(errorMsg);
      setMessageType('error');
      onError?.(errorMsg);
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      setMessageType('error');
      onError?.(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');
      setMessageType(null);

      // First, verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: formData.currentPassword,
      });

      if (signInError) {
        throw new Error('Senha atual incorreta');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) {
        throw updateError;
      }

      const successMsg = 'Senha alterada com sucesso!';
      setMessage(successMsg);
      setMessageType('success');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      onSuccess?.();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao alterar senha';
      console.error('Erro ao alterar senha:', error);
      setMessage(errorMsg);
      setMessageType('error');
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">
            Senha Atual
          </label>
          <input
            type="password"
            id="current-password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Digite sua senha atual"
            required
          />
        </div>
        
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
            Nova Senha
          </label>
          <input
            type="password"
            id="new-password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Digite a nova senha (mín. 6 caracteres)"
            minLength={6}
            required
          />
        </div>
        
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar Nova Senha
          </label>
          <input
            type="password"
            id="confirm-password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Confirme a nova senha"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg 
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Alterando Senha...
            </div>
          ) : (
            'Alterar Senha'
          )}
        </button>
      </form>
      
      {message && (
        <div className={`
          text-sm p-3 rounded-md
          ${messageType === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
          }
        `}>
          {message}
        </div>
      )}
    </div>
  );
}
