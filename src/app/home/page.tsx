'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileDashboard from '@/components/mobile/MobileDashboard';

export default function HomePage() {
    const router = useRouter();

    // Se acessar /home sem slug, redireciona para /
    useEffect(() => {
        router.push('/');
    }, [router]);

    return <MobileDashboard />;
}
