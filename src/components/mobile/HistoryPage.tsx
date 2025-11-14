'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface HistoryItem {
    id: number;
    machine_id: number;
    machine_location: string;
    started_at: string;
    ended_at: string | null;
    duration_minutes: number;
    cost: number;
    status: string;
    formatted_date: string;
}

export default function HistoryPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(`/api/history/user?userId=${user.id}&limit=50`);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao carregar histórico');
                }

                const data = await response.json();
                setHistory(data.history || []);
            } catch (err) {
                console.error('Error loading history:', err);
                setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [user]);

    if (loading) {
        return (
            <div className="px-4 py-6 text-center">
                <p className="text-gray-400">Carregando histórico...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 py-6 text-center">
                <p className="text-red-500">Erro: {error}</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="px-4 py-6">
                <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                    HISTÓRICO
                </h1>
                <div className="text-center text-gray-400 py-8">
                    <p>Nenhum uso de máquina registrado ainda</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-6">
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                HISTÓRICO
            </h1>

            <div className="space-y-4">
                {history.map((item) => (
                    <div key={item.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-semibold">
                                {item.machine_location}
                            </span>
                            <span className="text-orange-500 font-bold">
                                R$ {(item.cost / 1).toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            {item.formatted_date}
                        </p>
                        {item.duration_minutes > 0 && (
                            <p className="text-gray-400 text-sm">
                                Duração: {item.duration_minutes} minutos
                            </p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                            Status: {item.status === 'concluído' ? '✓ Concluído' : item.status}
                        </p>
                    </div>
                ))}
            </div>

            {history.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                    <p className="text-gray-400 text-sm">
                        Total de registros: {history.length}
                    </p>
                </div>
            )}
        </div>
    );
}
