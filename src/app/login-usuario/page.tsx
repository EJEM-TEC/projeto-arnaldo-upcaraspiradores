'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function MobileLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            // Verifica se há erro na URL (vindo do callback do OAuth)
            const urlParams = new URLSearchParams(window.location.search);
            const errorParam = urlParams.get('error');
            
            if (errorParam) {
                if (errorParam === 'auth_failed') {
                    setError('Erro ao autenticar. Tente novamente.');
                } else if (errorParam === 'unexpected_error') {
                    setError('Erro inesperado. Tente novamente.');
                } else {
                    setError('Erro ao fazer login com Google. Tente novamente.');
                }
                // Remove o erro da URL
                window.history.replaceState({}, '', '/login-usuario');
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.push('/home');
            } else {
                setLoading(false);
            }
        };
        checkSession();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError('Credenciais inválidas. Verifique seu e-mail e senha.');
            setLoading(false);
        } else {
            router.push('/home');
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Informa ao Supabase para onde redirecionar o usuário
                // DEPOIS que ele fizer login no Google e voltar para o seu app.
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError('Erro ao fazer login com Google: ' + error.message);
            setLoading(false);
        }
        // Não precisa de 'else', o redirecionamento para o Google vai acontecer automaticamente.
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-white">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <Image src="/upcar_preto_menor.png" alt="UpCar Logo" width={200} height={100} className="mx-auto mb-1" />
                <div className="text-center">
                    <div className="w-64 h-px bg-white mx-auto"></div>
                    <p className="text-gray-400 text-smitalic text-xl">Aspiradores <span className="font-bold">inteligentes</span></p>
                </div>
            </div>

            {/* Google Login Section */}
            <div className="mb-8">
                <h2 className="text-white text-2xl font-semibold text-center mb-6">Conta Google</h2>
                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-lg"
                >
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                        </div>
                        <div className="text-left">
                            <p className="text-gray-900 font-medium text-sm">Fazer login como Maria da Silva</p>
                            <p className="text-gray-600 text-xs">maria.silva@gmail.com</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>
            </div>

            {/* Separator */}
            <div className="flex items-center mb-8">
                <div className="flex-1 h-px bg-gray-600"></div>
                <span className="px-4 text-white text-sm">OU</span>
                <div className="flex-1 h-px bg-gray-600"></div>
            </div>

            {/* Manual Login Section */}
            <div className="mb-8">
                <h2 className="text-white text-2xl font-semibold text-center mb-6">ACESSE SUA CONTA</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 text-red-400 rounded-lg text-sm border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-4 bg-white border border-gray-700 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                        placeholder="E-mail"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-4 bg-white border border-gray-700 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                        placeholder="Senha"
                    />

                    <div className="text-right">
                        <button
                            type="button"
                            className="text-gray-400 text-sm hover:text-orange-500 transition-colors"
                        >
                            Recuperar senha
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold text-base hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Carregando...' : 'ENTRAR'}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push('/signup-usuario')}
                        className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold text-base hover:bg-orange-600 transition-colors"
                    >
                        NOVO CADASTRO
                    </button>
                </form>
            </div>

            {/* Footer */}
            <div className="text-center mt-12">
                <p className="text-gray-400 text-sm mb-2">Desenvolvido por:</p>
                <div className="text-center">
                    <span className="text-white font-semibold">UpCar</span>
                    <span className="text-orange-500 font-semibold">Aspiradores</span>
                </div>
            </div>
        </div>
    );
}
