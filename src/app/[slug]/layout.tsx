'use client';

import { MachineProvider } from '@/contexts/MachineContext';
import { getMachineBySlug } from '@/lib/database';
import { useEffect, useState } from 'react';

export default function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  const [initialMachine, setInitialMachine] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSlug = async () => {
      try {
        const resolvedParams = await params;
        setSlug(resolvedParams.slug);

        // Pré-carregar a máquina no servidor
        const { data } = await getMachineBySlug(resolvedParams.slug);
        setInitialMachine(data);
      } catch (error) {
        console.error('Error loading slug:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSlug();
  }, [params]);

  if (isLoading || !slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <MachineProvider initialSlug={slug} initialMachine={initialMachine}>
      {children}
    </MachineProvider>
  );
}
