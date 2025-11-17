'use client';

import { useParams } from 'next/navigation';
import MobileDashboard from '@/components/mobile/MobileDashboard';

export default function HomeSlugPage() {
    const params = useParams();
    const slug = params?.slug as string | undefined;

    return <MobileDashboard machineSlug={slug} />;
}
