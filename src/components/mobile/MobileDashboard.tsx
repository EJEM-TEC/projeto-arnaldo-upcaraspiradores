'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import LateralMenu from '@/components/LateralMenu';
import MobileNavbar from '@/components/mobile/MobileNavbar';
import HomePage from '@/components/mobile/HomePage';
import AddCreditPage from '@/components/mobile/AddCreditPage';
import PixPage from '@/components/mobile/PixPage';
import CreditCardPage, { type CardData } from '@/components/mobile/CreditCardPage';
import MonthlyPage from '@/components/mobile/MonthlyPage';
import PixCodePage from '@/components/mobile/PixCodePage';
import TimerPage from '@/components/mobile/TimerPage';
import BalancePage from '@/components/mobile/BalancePage';
import HistoryPage from '@/components/mobile/HistoryPage';
import SupportPage from '@/components/mobile/SupportPage';
import TermsPage from '@/components/mobile/TermsPage';
import PrivacyPage from '@/components/mobile/PrivacyPage';

type MobileView = 'home' | 'balance' | 'add-credit' | 'pix' | 'credit-card' | 'monthly' | 'pix-code' | 'timer' | 'history' | 'support' | 'terms' | 'privacy';

export default function MobileDashboard() {
    const [currentView, setCurrentView] = useState<MobileView>('add-credit');
    const [balance] = useState('0,00');
    const [user, setUser] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [paymentData, setPaymentData] = useState<{
        amount: string;
        cpf?: string;
        cardData?: CardData;
        pixCode?: string;
        qrCode?: string;
    } | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            // Primeiro tenta obter a sessão
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('Error getting session:', sessionError);
                router.push('/login-usuario');
                return;
            }

            if (!session || !session.user) {
                // Se não há sessão, tenta obter o usuário diretamente
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (!user || userError) {
                    router.push('/login-usuario');
                    return;
                }

                setUser(user);
                setLoading(false);
            } else {
                setUser(session.user);
                setLoading(false);
            }
        };

        checkAuth();

        // Listener para mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                setLoading(false);
            } else {
                router.push('/login-usuario');
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handlePaymentSelect = (method: string) => {
        switch (method) {
            case 'credit-card':
                setCurrentView('credit-card');
                break;
            case 'pix':
                setCurrentView('pix');
                break;
            case 'monthly':
                setCurrentView('monthly');
                break;
        }
    };

    const handlePixNext = (data: { amount: string; cpf: string; pixCode?: string; qrCode?: string }) => {
        setPaymentData(data);
        setCurrentView('pix-code');
    };

    const handlePaymentNext = (data: { amount: string; cardData?: CardData }) => {
        setPaymentData(data);
        setCurrentView('timer');
    };

    const handlePixCopyCode = () => {
        console.log('PIX code copied');
        // Here you would typically copy the PIX code to clipboard
        setCurrentView('timer');
    };

    const handleTimerStart = () => {
        console.log('Timer started');
        // Here you would start the vacuum cleaner timer
    };

    const renderContent = () => {
        switch (currentView) {
            case 'home':
                return <HomePage />;
            case 'balance':
                return <BalancePage balance={balance} />;
            case 'add-credit':
                return <AddCreditPage onPaymentSelect={handlePaymentSelect} />;
            case 'pix':
                return <PixPage onNext={handlePixNext} />;
            case 'credit-card':
                return <CreditCardPage onNext={handlePaymentNext} />;
            case 'monthly':
                return <MonthlyPage onNext={handlePaymentNext} />;
            case 'pix-code':
                return <PixCodePage
                    amount={paymentData?.amount || '0'}
                    cpf={paymentData?.cpf || ''}
                    pixCode={paymentData?.pixCode}
                    qrCode={paymentData?.qrCode}
                    onCopyCode={handlePixCopyCode}
                />;
            case 'timer':
                return <TimerPage
                    amount={balance}
                    onStart={handleTimerStart}
                />;
            case 'history':
                return <HistoryPage />;
            case 'support':
                return <SupportPage />;
            case 'terms':
                return <TermsPage />;
            case 'privacy':
                return <PrivacyPage />;
            default:
                return <HomePage />;
        }
    };

    const handleMenuAction = (action: () => void) => {
        action();
        setIsMenuOpen(false);
    };

    const menuItems = [
        { icon: '🏠', text: 'Home', action: () => setCurrentView('home') },
        { icon: '💰', text: `Meu saldo: R$ ${balance}`, action: () => setCurrentView('balance') },
        { icon: '➕', text: 'Adicionar crédito', action: () => setCurrentView('add-credit') },
        { icon: '🔄', text: 'Histórico', action: () => setCurrentView('history') },
        { icon: '❓', text: 'Suporte', action: () => setCurrentView('support') },
        { icon: '📄', text: 'Termos e Condições', action: () => setCurrentView('terms') },
        { icon: '📄', text: 'Política de Privacidade', action: () => setCurrentView('privacy') },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-white">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black relative">
            {/* Lateral Menu */}
            <LateralMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                user={user}
                balance={balance}
                menuItems={menuItems}
                onMenuAction={handleMenuAction}
            />

            {/* Navbar */}
            <MobileNavbar onMenuClick={() => setIsMenuOpen(true)} />

            {/* Main Content */}
            <div className="flex-1">
                {renderContent()}
            </div>

            {/* Balance Section - Only show on home page */}
            {currentView === 'home' && (
                <div className="px-4 pb-8">
                    {/* Separator */}
                    <div className="w-full h-px bg-orange-500 mb-6"></div>

                    {/* Balance Display */}
                    <div className="text-center">
                        <p className="text-white text-xl font-bold uppercase mb-4">
                            MEU SALDO: R$ {balance}
                        </p>

                        {/* Add Balance Button */}
                        <button
                            onClick={() => setCurrentView('add-credit')}
                            className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto hover:bg-orange-600 transition-colors"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
