// src/components/AddMachineForm.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { generateSlug } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '../components/ui/input';

interface AddMachineFormProps {
  onSuccess?: () => void;
}

export function AddMachineForm({ onSuccess }: AddMachineFormProps) {
    const [machineId, setMachineId] = useState('');
    const [location, setLocation] = useState('');
    const [generatedSlug, setGeneratedSlug] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Gera slug automaticamente ao digitar localização
    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLocation = e.target.value;
        setLocation(newLocation);

        // Gera preview do slug
        if (newLocation && machineId) {
            const machineNum = parseInt(machineId);
            if (!isNaN(machineNum)) {
                const slug = generateSlug(newLocation, machineNum);
                setGeneratedSlug(slug);
            }
        }
    };

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newId = e.target.value;
        setMachineId(newId);

        // Regenera slug quando ID mudar
        if (newId && location) {
            const machineNum = parseInt(newId);
            if (!isNaN(machineNum)) {
                const slug = generateSlug(location, machineNum);
                setGeneratedSlug(slug);
            }
        }
    };

    async function handleAddMachine(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

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

        const slug = generateSlug(location, machineNum);

        // Verifica se o slug já existe
        const { data: existingMachine, error: checkError } = await supabase
            .from('machines')
            .select('id')
            .eq('slug_id', slug)
            .maybeSingle();

        if (existingMachine) {
            setError(`Slug '${slug}' já está em uso. Mude a localização ou ID.`);
            setLoading(false);
            return;
        }

        // Insere a máquina com o slug gerado
        const { error: insertError } = await supabase
            .from('machines')
            .insert({
                id: machineNum,
                location: location,
                slug_id: slug,
                status: 'offline',
                command: 'off'
            });

        if (insertError) {
            setError(`Erro ao adicionar máquina: ${insertError.message}`);
        } else {
            setSuccess(`✅ Máquina adicionada com sucesso! Slug: ${slug}`);
            setMachineId('');
            setLocation('');
            setGeneratedSlug('');
            
            if (onSuccess) {
                onSuccess();
            } else {
                setTimeout(() => window.location.reload(), 1500);
            }
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
                    onChange={handleIdChange}
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
                    onChange={handleLocationChange}
                    placeholder="Ex: Shopping Center A"
                    required
                />
            </div>

            {/* Preview do slug gerado */}
            {generatedSlug && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="text-gray-700">
                        <strong>Slug gerado:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{generatedSlug}</code>
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                        URL de acesso: <code className="bg-gray-200 px-2 py-1 rounded">/maquina/{generatedSlug}</code>
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