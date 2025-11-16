// src/components/AddMachineForm.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '../components/ui/input';

interface AddMachineFormProps {
  onSuccess?: () => void;
}

export function AddMachineForm({ onSuccess }: AddMachineFormProps) {
    const [machineId, setMachineId] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [generatedSlug, setGeneratedSlug] = useState('');

    async function handleAddMachine(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        setGeneratedSlug('');

        if (!machineId || !location) {
            setError('ID e Localização são obrigatórios.');
            setLoading(false);
            return;
        }

        const machineNum = parseInt(machineId);
        if (isNaN(machineNum)) {
            setError('ID deve ser um número válido.');
            setLoading(false);
            return;
        }

        try {
            // O slug é gerado automaticamente pelo trigger no banco de dados
            // Apenas inserimos ID e localização
            const { data, error: insertError } = await supabase
                .from('machines')
                .insert({
                    id: machineNum,
                    location: location,
                    status: 'offline',
                    command: 'off'
                })
                .select()
                .single();

            if (insertError) {
                setError(`Erro ao adicionar máquina: ${insertError.message}`);
            } else {
                const slug = data?.slug_id || 'gerado-automaticamente';
                setSuccess(`✅ Máquina adicionada com sucesso! Slug gerado: ${slug}`);
                setGeneratedSlug(slug);
                setMachineId('');
                setLocation('');
                
                if (onSuccess) {
                    onSuccess();
                } else {
                    setTimeout(() => window.location.reload(), 2000);
                }
            }
        } catch (err) {
            console.error('Erro ao adicionar máquina:', err);
            setError('Erro inesperado ao adicionar máquina.');
        }
        
        setLoading(false);
    }

    return (
        <form onSubmit={handleAddMachine} className="p-4 border rounded-lg space-y-4 bg-card text-card-foreground">
            <h3 className="text-lg font-bold">Adicionar Nova Máquina</h3>
            
            <div>
                <label htmlFor="machineId" className="block text-sm font-medium mb-1">ID da Máquina</label>
                <Input
                    id="machineId"
                    type="number"
                    value={machineId}
                    onChange={(e) => setMachineId(e.target.value)}
                    placeholder="Ex: 22027"
                    required
                />
            </div>

            <div>
                <label htmlFor="location" className="block text-sm font-medium mb-1">Localização</label>
                <Input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Shopping Center A"
                    required
                />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="text-gray-700">
                    ℹ️ <strong>Slug gerado automaticamente</strong>
                </p>
                <p className="text-gray-600 text-xs mt-1">
                    Um código de 6 dígitos será gerado automaticamente ao cadastrar a máquina.
                </p>
            </div>

            {generatedSlug && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                    <p className="text-gray-700">
                        ✅ <strong>Slug gerado:</strong> <code className="bg-gray-200 px-2 py-1 rounded text-base font-bold">{generatedSlug}</code>
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                        URL de acesso: <code className="bg-gray-200 px-2 py-1 rounded">/{generatedSlug}</code>
                    </p>
                </div>
            )}

            {error && <p className="text-destructive text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm font-medium">{success}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Adicionando...' : 'Adicionar Máquina'}
            </Button>
        </form>
    );
}