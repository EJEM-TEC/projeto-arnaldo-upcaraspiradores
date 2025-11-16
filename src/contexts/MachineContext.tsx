'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Machine } from '@/lib/database';

interface MachineContextType {
  machine: Machine | null;
  slug: string | null;
  loading: boolean;
  error: string | null;
  setMachine: (machine: Machine | null) => void;
  setSlug: (slug: string) => void;
}

const MachineContext = createContext<MachineContextType | undefined>(undefined);

export function MachineProvider({
  children,
  initialSlug,
  initialMachine,
}: {
  children: React.ReactNode;
  initialSlug: string;
  initialMachine?: Machine | null;
}) {
  const [machine, setMachine] = useState<Machine | null>(initialMachine || null);
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [loading, setLoading] = useState(!initialMachine);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMachine) {
      setMachine(initialMachine);
      setLoading(false);
      return;
    }

    // Se não temos a máquina inicial, buscamos pelo slug
    if (!initialSlug) {
      setLoading(false);
      return;
    }

    const fetchMachine = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/machine/by-slug?slug=${encodeURIComponent(initialSlug)}`
        );

        if (!response.ok) {
          throw new Error('Máquina não encontrada');
        }

        const data = await response.json();
        setMachine(data.machine);
        setError(null);
      } catch (err) {
        console.error('Error fetching machine:', err);
        setError(
          err instanceof Error ? err.message : 'Erro ao carregar máquina'
        );
        setMachine(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMachine();
  }, [initialSlug, initialMachine]);

  return (
    <MachineContext.Provider
      value={{
        machine,
        slug,
        loading,
        error,
        setMachine,
        setSlug,
      }}
    >
      {children}
    </MachineContext.Provider>
  );
}

export function useMachine() {
  const context = useContext(MachineContext);
  if (context === undefined) {
    throw new Error('useMachine deve ser usado dentro de MachineProvider');
  }
  return context;
}
