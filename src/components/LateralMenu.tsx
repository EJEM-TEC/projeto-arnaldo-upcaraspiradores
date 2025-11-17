'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import CheckoutProModal from '@/components/CheckoutProModal';

interface LateralMenuProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    balance: string;
    menuItems?: Array<{ icon: string; text: string; action: () => void }>;
    onMenuAction?: (action: () => void) => void;
}

export default function LateralMenu({ isOpen, onClose, user, balance, menuItems, onMenuAction }: LateralMenuProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        router.push('/login-usuario');
    };

    const handleBalanceClick = () => {
        setShowCheckoutModal(true);
    };

    const handleCheckoutSuccess = () => {
        // O hook useBalance vai atualizar o saldo automaticamente via realtime
        setShowCheckoutModal(false);
    };

    const defaultMenuItems = [
        { icon: '🏠', text: 'Home', action: () => router.push('/home') },
        { icon: '💰', text: `Meu saldo: R$ ${balance}`, action: handleBalanceClick },
        { icon: '➕', text: 'Adicionar crédito', action: handleBalanceClick },
        { icon: '🔄', text: 'Histórico', action: () => console.log('History clicked') },
        { icon: '❓', text: 'Suporte', action: () => console.log('Support clicked') },
        { icon: '📄', text: 'Termos e Condições', action: () => console.log('Terms clicked') },
        { icon: '📄', text: 'Política de Privacidade', action: () => console.log('Privacy clicked') },
    ];

    const itemsToRender = menuItems || defaultMenuItems;

    if (!isOpen) return null;

    return (
        <>
            {/* Checkout Pro Modal */}
            <CheckoutProModal
                isOpen={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                onSuccess={handleCheckoutSuccess}
            />

            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Menu */}
            <div className="fixed left-0 top-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out">
                <div className="p-6 h-full flex flex-col">
                    {/* User Profile Header */}
                    <div className="mb-8">
                        <div className="flex items-center space-x-4 mb-4">
                            {/* Avatar */}
                            <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>

                            {/* User Info */}
                            <div>
                                <h3 className="text-black text-lg font-bold">
                                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    {user?.email || 'email@exemplo.com'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <div className="flex-1">
                        {itemsToRender.map((item, index) => (
                            <div key={index}>
                                <button
                                    onClick={() => {
                                        if (onMenuAction) {
                                            onMenuAction(item.action);
                                        } else {
                                            item.action();
                                            onClose();
                                        }
                                    }}
                                    className="w-full flex items-center space-x-4 py-4 text-left hover:bg-gray-300 transition-colors"
                                >
                                    <span className="text-2xl">{item.icon}</span>
                                    <span className="text-black font-medium">{item.text}</span>
                                </button>

                                {/* Separator */}
                                {index < itemsToRender.length - 1 && (
                                    <div className="w-full h-px bg-gray-300"></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Logout Section */}
                    <div className="mt-8">
                        <div className="w-full h-px bg-gray-300 mb-4"></div>
                        <button
                            onClick={handleLogout}
                            disabled={loading}
                            className="w-full flex items-center space-x-4 py-4 text-left hover:bg-gray-300 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-black font-medium">
                                {loading ? 'Saindo...' : 'Sair'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
