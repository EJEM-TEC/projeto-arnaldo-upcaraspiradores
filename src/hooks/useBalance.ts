'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UseBalanceReturn {
  balance: string;
  balanceRaw: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBalance(userId: string | null): UseBalanceReturn {
  const [balance, setBalance] = useState('0,00');
  const [balanceRaw, setBalanceRaw] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar o saldo
  const fetchBalance = useCallback(async () => {
    if (!userId) {
      setBalance('0,00');
      setBalanceRaw(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('saldo')
        .eq('id', userId)
        .maybeSingle();

      if (queryError) {
        console.error('Error fetching balance:', queryError);
        setError('Erro ao carregar saldo');
        setBalance('0,00');
        setBalanceRaw(0);
        setLoading(false);
        return;
      }

      const balanceValue = data?.saldo || 0;
      setBalanceRaw(balanceValue);
      setBalance(balanceValue.toFixed(2).replace('.', ','));
      setError(null);
    } catch (err) {
      console.error('Unexpected error fetching balance:', err);
      setError('Erro ao carregar saldo');
      setBalance('0,00');
      setBalanceRaw(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Buscar saldo inicialmente
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Se inscrever em mudanças em tempo real
  useEffect(() => {
    if (!userId) return;

    console.log(`🔔 Subscribing to balance updates for user: ${userId}`);

    // Subscrição em tempo real para mudanças na tabela profiles
    const subscription = supabase
      .channel(`public:profiles:id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Ouve INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('💰 Balance update received:', payload);
          
          if (payload.new && typeof payload.new === 'object' && 'saldo' in payload.new) {
            const newBalance = (payload.new as { saldo: number }).saldo || 0;
            setBalanceRaw(newBalance);
            setBalance(newBalance.toFixed(2).replace('.', ','));
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CLOSED') {
          console.warn('⚠️ Subscription closed');
        }
        if (err) {
          console.error('Subscription error:', err);
        }
      });

    // Cleanup
    return () => {
      console.log(`🔌 Unsubscribing from balance updates for user: ${userId}`);
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    balance,
    balanceRaw,
    loading,
    error,
    refetch: fetchBalance,
  };
}
