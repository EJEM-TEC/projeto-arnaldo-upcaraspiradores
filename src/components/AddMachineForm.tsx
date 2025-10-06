// src/components/AddMachineForm.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '../components/ui/input';

export function AddMachineForm() {
    const [machineId, setMachineId] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function handleAddMachine(e: React.FormEvent) {
        // ... (toda a lógica da função continua a mesma)
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!machineId || !location) {
            setError('ID e Localização são obrigatórios.');
            setLoading(false);
            return;
        }

        const { error: insertError } = await supabase
            .from('machines')
            .insert({ id: parseInt(machineId), location: location });

        if (insertError) {
            setError(`Erro ao adicionar máquina: ${insertError.message}`);
        } else {
            setSuccess(`Máquina ${machineId} adicionada com sucesso!`);
            setMachineId('');
            setLocation('');
            window.location.reload();
        }
        setLoading(false);
    }

    return (
        <form onSubmit={handleAddMachine} className="p-4 border rounded-lg space-y-4 bg-card text-card-foreground">
            <h3 className="text-lg font-bold">Adicionar Nova Máquina</h3>
            <div>
                <label htmlFor="machineId" className="block text-sm font-medium mb-1">ID da Máquina</label>
                {/* Usamos o Input do shadcn/ui aqui também para consistência */}
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
            {error && <p className="text-destructive text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}

            {/* AQUI: Usamos o novo componente Button */}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Adicionando...' : 'Adicionar Máquina'}
            </Button>
        </form>
    );
}