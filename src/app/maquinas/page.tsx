'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Machine, getAllMachines } from '@/lib/database';

export default function ListaMaquinasPage() {
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMachines = async () => {
            try {
                setLoading(true);
                const { data, error: fetchError } = await getAllMachines();

                if (fetchError) {
                    throw new Error('Erro ao carregar máquinas');
                }

                setMachines(data || []);
            } catch (err) {
                console.error('Error fetching machines:', err);
                setError(err instanceof Error ? err.message : 'Erro ao carregar máquinas');
            } finally {
                setLoading(false);
            }
        };

        fetchMachines();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-white">Carregando máquinas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-2">Máquinas Disponíveis</h1>
                    <p className="text-gray-400">
                        Clique em uma máquina para acessar seus detalhes e ativar
                    </p>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-lg mb-8">
                        {error}
                    </div>
                )}

                {machines.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-lg">Nenhuma máquina disponível</p>
                        <p className="text-gray-500 text-sm mt-2">
                            Entre em contato com o suporte para adicionar máquinas
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {machines.map((machine) => (
                            <Link
                                key={machine.id}
                                href={`/maquina/${machine.id}`}
                                className="group"
                            >
                                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-orange-500 transition group-hover:bg-gray-800/50">
                                    {/* Header */}
                                    <div className="mb-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition">
                                                    Máquina #{machine.id}
                                                </h3>
                                                <p className="text-sm text-orange-500">
                                                    {machine.slug_id}
                                                </p>
                                            </div>
                                            <div className="text-2xl">
                                                {machine.status === 'online' ? (
                                                    <span className="text-green-500">🟢</span>
                                                ) : (
                                                    <span className="text-gray-500">⚪</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="mb-4">
                                        <p className="text-gray-400 text-sm">Localização</p>
                                        <p className="text-lg font-semibold text-white">
                                            {machine.location || 'Não informada'}
                                        </p>
                                    </div>

                                    {/* Status e Command */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-gray-800/50 rounded p-3">
                                            <p className="text-xs text-gray-500 uppercase">Status</p>
                                            <p className="text-sm font-bold text-white">
                                                {machine.status === 'online' ? 'Online' : 'Offline'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/50 rounded p-3">
                                            <p className="text-xs text-gray-500 uppercase">Comando</p>
                                            <p className="text-sm font-bold text-white">
                                                {machine.command === 'on' ? 'Ligada' : 'Desligada'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className="pt-4 border-t border-gray-800">
                                        <p className="text-sm text-gray-400 group-hover:text-orange-500 transition">
                                            Ver detalhes →
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
