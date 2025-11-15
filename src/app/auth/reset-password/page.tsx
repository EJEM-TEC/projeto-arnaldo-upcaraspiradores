'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            // Aguarda um pouco para o Supabase processar o hash da URL (se houver)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verifica se há uma sessão válida
            // Quando o usuário clica no link de reset, Supabase processa o hash automaticamente
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
                setLoading(false);
                return;
            }

            setLoading(false);
        };

        // Também escuta mudanças no estado de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
                setLoading(false);
            }
        });

        checkSession();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validações
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setSubmitting(true);

        // Verifica se há uma sessão válida
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            setError('Sessão expirada. Solicite um novo link de recuperação.');
            setSubmitting(false);
            return;
        }

        // Atualiza a senha
        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        if (updateError) {
            setError('Erro ao atualizar senha. Tente novamente ou solicite um novo link.');
            setSubmitting(false);
        } else {
            setSuccess(true);
            setSubmitting(false);

            // Redireciona para login após 2 segundos
            setTimeout(() => {
                router.push('/login-usuario');
            }, 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-white">Verificando link...</p>
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

            {/* Reset Password Section */}
            <div className="mb-8">
                <h2 className="text-white text-2xl font-semibold text-center mb-6">REDEFINIR SENHA</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 text-red-400 rounded-lg text-sm border border-red-500/20">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="space-y-4">
                        <div className="mb-4 p-4 bg-green-900/20 text-green-400 rounded-lg text-sm border border-green-500/20">
                            <p className="font-semibold mb-2">Senha redefinida com sucesso!</p>
                            <p>Redirecionando para a página de login...</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push('/login-usuario')}
                            className="w-full max-w-xs mx-auto block bg-orange-500 text-white py-4 rounded-md font-semibold text-base hover:bg-orange-600 transition-colors"
                        >
                            IR PARA LOGIN
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-gray-400 text-sm text-center mb-6 px-4">
                            Digite sua nova senha abaixo.
                        </p>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full max-w-xs mx-auto block px-4 py-4 bg-white border border-gray-700 rounded-md text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                            placeholder="Nova senha"
                        />

                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full max-w-xs mx-auto block px-4 py-4 bg-white border border-gray-700 rounded-md text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                            placeholder="Confirmar nova senha"
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full max-w-xs mx-auto block bg-orange-500 text-white py-4 rounded-md font-semibold text-base hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Atualizando...' : 'REDEFINIR SENHA'}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push('/login-usuario')}
                            className="w-full max-w-xs mx-auto block bg-transparent border-2 border-orange-500 text-orange-500 py-4 rounded-md font-semibold text-base hover:bg-orange-500 hover:text-white transition-colors"
                        >
                            VOLTAR AO LOGIN
                        </button>
                    </form>
                )}
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

