import { NextRequest, NextResponse } from 'next/server';
import { getUserActivationHistory } from '@/lib/database';

interface ActivationHistoryRecord {
  id: number;
  machine_id: number;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  cost: number;
  status: string;
  machines: Array<{
    id: number;
    location: string | null;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const limit = request.nextUrl.searchParams.get('limit');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const limitNumber = limit ? Math.min(parseInt(limit), 100) : 50;

    const { data, error } = await getUserActivationHistory(userId, limitNumber);

    if (error) {
      console.error('Error fetching user history:', error);
      return NextResponse.json(
        { error: 'Erro ao obter histórico' },
        { status: 500 }
      );
    }

    // Formata os dados para o frontend
    const formattedData = (data || []).map((activation: ActivationHistoryRecord) => {
      const machineLocation = activation.machines?.[0]?.location || `Aspirador #${activation.machine_id}`;
      
      return {
        id: activation.id,
        machine_id: activation.machine_id,
        machine_location: machineLocation,
        started_at: activation.started_at,
        ended_at: activation.ended_at,
        duration_minutes: activation.duration_minutes || 0,
        cost: activation.cost || 0,
        status: activation.status,
        formatted_date: new Date(activation.started_at).toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    });

    return NextResponse.json(
      {
        userId,
        history: formattedData,
        total: formattedData.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in get history route:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
