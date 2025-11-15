'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
            setError('Erro ao enviar e-mail de recuperação. Verifique se o e-mail está correto.');
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

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

            {/* Forgot Password Section */}
            <div className="mb-8">
                <h2 className="text-white text-2xl font-semibold text-center mb-6">RECUPERAR SENHA</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 text-red-400 rounded-lg text-sm border border-red-500/20">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="space-y-4">
                        <div className="mb-4 p-4 bg-green-900/20 text-green-400 rounded-lg text-sm border border-green-500/20">
                            <p className="font-semibold mb-2">E-mail enviado com sucesso!</p>
                            <p>Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push('/login-usuario')}
                            className="w-full max-w-xs mx-auto block bg-orange-500 text-white py-4 rounded-md font-semibold text-base hover:bg-orange-600 transition-colors"
                        >
                            VOLTAR AO LOGIN
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-gray-400 text-sm text-center mb-6 px-4">
                            Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
                        </p>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full max-w-xs mx-auto block px-4 py-4 bg-white border border-gray-700 rounded-md text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                            placeholder="E-mail"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full max-w-xs mx-auto block bg-orange-500 text-white py-4 rounded-md font-semibold text-base hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Enviando...' : 'ENVIAR LINK DE RECUPERAÇÃO'}
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

