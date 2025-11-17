'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useBalance } from '@/hooks/useBalance';
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
import WelcomePage from '@/components/mobile/WelcomePage';
import CheckoutProModal from '@/components/CheckoutProModal';

type MobileView = 'home' | 'balance' | 'add-credit' | 'pix' | 'credit-card' | 'monthly' | 'pix-code' | 'timer' | 'history' | 'support' | 'terms' | 'privacy';

interface MobileDashboardProps {
    machineSlug?: string;
}

export default function MobileDashboard({ machineSlug }: MobileDashboardProps) {
    const [currentView, setCurrentView] = useState<MobileView>('add-credit');
    const [user, setUser] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [appLoading, setAppLoading] = useState(true);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [paymentData, setPaymentData] = useState<{
        amount: string;
        cpf?: string;
        cardData?: CardData;
        pixCode?: string;
        qrCode?: string;
    } | null>(null);
    const router = useRouter();

    // Usar o hook useBalance para atualizar o saldo em tempo real
    const { balance, loading: balanceLoading } = useBalance(user?.id || null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('Error getting session:', sessionError);
                router.push('/login-usuario');
                return;
            }

            if (!session || !session.user) {
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (!user || userError) {
                    router.push('/login-usuario');
                    return;
                }

                setUser(user);
                setAppLoading(false);
                // Mostrar boas-vindas na primeira visita
                const hasSeenWelcome = localStorage.getItem(`welcome_${user.id}`);
                if (!hasSeenWelcome) {
                    setShowWelcome(true);
                    localStorage.setItem(`welcome_${user.id}`, 'true');
                }
            } else {
                setUser(session.user);
                setAppLoading(false);
                // Mostrar boas-vindas na primeira visita
                const hasSeenWelcome = localStorage.getItem(`welcome_${session.user.id}`);
                if (!hasSeenWelcome) {
                    setShowWelcome(true);
                    localStorage.setItem(`welcome_${session.user.id}`, 'true');
                }
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                setAppLoading(false);
                // Mostrar boas-vindas na primeira visita
                const hasSeenWelcome = localStorage.getItem(`welcome_${session.user.id}`);
                if (!hasSeenWelcome) {
                    setShowWelcome(true);
                    localStorage.setItem(`welcome_${session.user.id}`, 'true');
                }
            } else {
                router.push('/login-usuario');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
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

    const handleTimerStart = async (durationMinutes: number) => {
        console.log('Timer started with duration:', durationMinutes);
        if (!user) return;

        try {
            setAppLoading(true);
            
            // Chama a API para ativar a máquina (máquina 1 por padrão)
            const response = await fetch('/api/machine/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    machineId: 1, // ID padrão da máquina
                    durationMinutes: durationMinutes
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Erro: ${errorData.error}`);
                setAppLoading(false);
                // O hook useBalance vai atualizar o saldo automaticamente
                return;
            }

            const data = await response.json();
            console.log('Machine activated:', data);

            // O hook useBalance vai atualizar o saldo automaticamente via realtime
            setAppLoading(false);

            // Inicia o countdown
            let remainingSeconds = durationMinutes * 60;
            
            const countdownInterval = setInterval(async () => {
                remainingSeconds--;
                
                if (remainingSeconds <= 0) {
                    clearInterval(countdownInterval);
                    
                    // Desativa a máquina
                    try {
                        await fetch('/api/machine/deactivate', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                machineId: 1
                            })
                        });
                    } catch (error) {
                        console.error('Error deactivating machine:', error);
                    }

                    alert('Tempo de uso expirou! Máquina desativada.');
                    setCurrentView('home');
                }
            }, 1000);

        } catch (error) {
            console.error('Error activating machine:', error);
            alert('Erro ao ativar a máquina');
            setAppLoading(false);
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case 'home':
                return <HomePage />;
            case 'balance':
                return <BalancePage balance={balance} onAddCredit={() => setShowCheckoutModal(true)} />;
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

    const handleBalanceClick = () => {
        setShowCheckoutModal(true);
        setIsMenuOpen(false);
    };

    const handleCheckoutSuccess = () => {
        // O hook useBalance vai atualizar o saldo automaticamente via realtime
        // Não precisa fazer reload da página
        setShowCheckoutModal(false);
        setCurrentView('home');
    };

    const menuItems = [
        { icon: '🏠', text: 'Home', action: () => setCurrentView('home') },
        { icon: '💰', text: `Meu saldo: R$ ${balance}`, action: handleBalanceClick },
        { icon: '➕', text: 'Adicionar crédito', action: handleBalanceClick },
        { icon: '🔄', text: 'Histórico', action: () => setCurrentView('history') },
        { icon: '❓', text: 'Suporte', action: () => setCurrentView('support') },
        { icon: '📄', text: 'Termos e Condições', action: () => setCurrentView('terms') },
        { icon: '📄', text: 'Política de Privacidade', action: () => setCurrentView('privacy') },
    ];

    if (appLoading || balanceLoading) {
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
            {/* Welcome Modal */}
            {showWelcome && (
                <WelcomePage 
                    onClose={() => setShowWelcome(false)}
                    autoCloseDelay={5000}
                />
            )}

            {/* Checkout Pro Modal */}
            <CheckoutProModal
                isOpen={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                onSuccess={handleCheckoutSuccess}
            />

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
                            onClick={() => setShowCheckoutModal(true)}
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
