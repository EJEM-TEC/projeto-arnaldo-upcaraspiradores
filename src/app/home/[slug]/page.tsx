'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Machine, getMachineBySlugOrId } from '@/lib/database';

export default function MachineDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('[MACHINE DETAIL] params:', params);
  console.log('[MACHINE DETAIL] slug:', slug);

  useEffect(() => {
    const fetchMachine = async () => {
      if (!slug) {
        setError('Slug não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('[MACHINE DETAIL] Buscando máquina com slug:', slug);
        const { data, error: dbError } = await getMachineBySlugOrId(slug);

        if (dbError) {
          console.error('[MACHINE DETAIL] Erro ao buscar:', dbError);
          throw new Error('Erro ao buscar máquina');
        }

        if (!data) {
          throw new Error('Máquina não encontrada');
        }

        console.log('[MACHINE DETAIL] Máquina encontrada:', data);
        setMachine(data);
      } catch (err) {
        console.error('[MACHINE DETAIL] Error fetching machine:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar máquina');
      } finally {
        setLoading(false);
      }
    };

    fetchMachine();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Carregando máquina...</p>
        </div>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold mb-4">❌ Máquina não encontrada</h1>
          <p className="text-gray-400 mb-4">Slug: <code className="bg-gray-800 px-3 py-1 rounded">{slug}</code></p>
          <p className="text-gray-400 mb-8">{error}</p>
          <Link
            href="/"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Voltar ao Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/"
            className="text-orange-500 hover:text-orange-400 mb-4 inline-block"
          >
            ← Voltar
          </Link>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
          <h1 className="text-3xl font-bold mb-4">Máquina #{machine.id}</h1>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">Localização:</p>
              <p className="text-xl font-semibold">{machine.location || 'Não informada'}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Endereço:</p>
              <p className="text-xl font-semibold">{machine.address || 'Não informado'}</p>
            </div>

            {machine.slug_id && (
              <div>
                <p className="text-gray-400 text-sm">Código (slug):</p>
                <p className="text-xl font-semibold">{machine.slug_id}</p>
              </div>
            )}

            <div>
              <p className="text-gray-400 text-sm">Status:</p>
              <p className="text-xl font-semibold">{machine.status || 'Ativo'}</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition">
              Ativar Máquina
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
