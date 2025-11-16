'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Machine } from '@/lib/database';

export default function MaquinaSlugPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [machine, setMachine] = useState<Machine | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMachine = async () => {
            if (!slug) return;

            try {
                setLoading(true);
                const response = await fetch(`/api/machine/by-slug?slug=${encodeURIComponent(slug)}`);

                if (!response.ok) {
                    throw new Error('Máquina não encontrada');
                }

                const data = await response.json();
                setMachine(data.machine);
            } catch (err) {
                console.error('Error fetching machine:', err);
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
                    <a
                        href="/"
                        className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition"
                    >
                        Voltar à Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <a href="/" className="text-orange-500 hover:text-orange-400 mb-4 inline-block">
                        ← Voltar
                    </a>
                </div>

                <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2">Máquina #{machine.id}</h1>
                        <p className="text-orange-500 text-lg">
                            🏷️ {machine.slug_id}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Localização</h2>
                            <p className="text-2xl font-bold">{machine.location || 'Não informada'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Status</h3>
                                <p className="text-xl font-bold">
                                    {machine.status === 'online' ? (
                                        <span className="text-green-500">✅ Online</span>
                                    ) : (
                                        <span className="text-gray-500">⚪ Offline</span>
                                    )}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Comando</h3>
                                <p className="text-xl font-bold">
                                    {machine.command === 'on' ? (
                                        <span className="text-green-500">🟢 Ligada</span>
                                    ) : (
                                        <span className="text-gray-500">⚫ Desligada</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-800">
                            <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-4">Informações Técnicas</h3>
                            <div className="space-y-2 text-sm text-gray-400">
                                <p>
                                    <span className="text-gray-500">ID:</span> <code className="bg-gray-800 px-2 py-1 rounded">{machine.id}</code>
                                </p>
                                <p>
                                    <span className="text-gray-500">Slug:</span> <code className="bg-gray-800 px-2 py-1 rounded">{machine.slug_id}</code>
                                </p>
                                <p>
                                    <span className="text-gray-500">Criado em:</span>{' '}
                                    {machine.created_at
                                        ? new Date(machine.created_at).toLocaleDateString('pt-BR')
                                        : 'Desconhecido'}
                                </p>
                                <p>
                                    <span className="text-gray-500">Atualizado em:</span>{' '}
                                    {machine.updated_at
                                        ? new Date(machine.updated_at).toLocaleDateString('pt-BR')
                                        : 'Desconhecido'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-800">
                        <p className="text-gray-500 text-sm">
                            Acesse esta máquina novamente em:
                            <br />
                            <code className="bg-gray-800 px-3 py-1 rounded mt-2 inline-block">
                                /maquina/{machine.slug_id}
                            </code>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
