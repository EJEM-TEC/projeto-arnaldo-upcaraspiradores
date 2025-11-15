'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            setLoading(false);
            return;
        }

        try {
            // Call the backend API to create the user with profile
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    name,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Erro ao criar conta. Tente novamente.');
            } else {
                alert('Cadastro realizado com sucesso! Faça o login para continuar.');
                router.push('/login-usuario');
            }
        } catch (err) {
            setError('Erro ao criar conta. Tente novamente.');
            console.error('Signup error:', err);
        } finally {
            setLoading(false);
        }
    };

    // AQUI ESTÁ A ÚNICA MUDANÇA REAL
    const handleGoogleSignUp = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            }
        });

        if (error) {
            setError('Erro ao fazer cadastro com Google: ' + error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black px-4 py-8">
            {/* O resto do seu código JSX continua exatamente o mesmo... */}
            {/* Header */}
            <div className="mb-8">
                <Image src="/upcar_preto_menor.png" alt="UpCar Logo" width={200} height={100} className="mx-auto mb-1" />
                <div className="text-center">
                    <div className="w-64 h-px bg-white mx-auto"></div>
                    <p className="text-gray-400 italic text-xl">Aspiradores <span className="font-bold">inteligentes</span></p>
                </div>
            </div>

            {/* Google Sign Up Section */}
            <div className="mb-8">
                <h2 className="text-white text-2xl font-semibold text-center mb-6">Conta Google</h2>
                <button
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                    className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-lg disabled:opacity-50"
                >
                    {/* ... conteúdo do botão ... */}
                    <div className="text-left">
                        <p className="text-gray-900 font-medium text-sm">Cadastrar com Google</p>
                        <p className="text-gray-600 text-xs">Criar conta rapidamente</p>
                    </div>
                </button>
            </div>

            {/* Separator */}
            <div className="flex items-center mb-8">
                <div className="flex-1 h-px bg-gray-600"></div>
                <span className="px-4 text-white text-sm">OU</span>
                <div className="flex-1 h-px bg-gray-600"></div>
            </div>

            {/* Manual Sign Up Section */}
            <div className="mb-8">
                <h2 className="text-white text-2xl font-semibold text-center mb-6">CRIAR CONTA</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 text-red-400 rounded-lg text-sm border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ... seus inputs ... */}
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-4 bg-white border border-gray-700 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Nome completo" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-4 bg-white border border-gray-700 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="E-mail" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-4 bg-white border border-gray-700 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Senha" />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-4 bg-white border border-gray-700 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Confirmar senha" />

                    <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold text-base hover:bg-orange-600 transition-colors disabled:opacity-50">
                        {loading ? 'Criando conta...' : 'CRIAR CONTA'}
                    </button>
                    <button type="button" onClick={() => router.push('/login-usuario')} className="w-full bg-gray-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-gray-700 transition-colors">
                        VOLTAR AO LOGIN
                    </button>
                </form>
            </div>
        </div>
    );
}