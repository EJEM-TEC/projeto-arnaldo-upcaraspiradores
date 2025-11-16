import { NextRequest, NextResponse } from 'next/server';
import { getMachineBySlug } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing required parameter: slug' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching machine by slug: ${slug}`);

    const { data, error } = await getMachineBySlug(slug);

    if (error) {
      console.error('Error fetching machine by slug:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar máquina' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Máquina não encontrada', slug },
        { status: 404 }
      );
    }

    console.log(`✅ Machine found:`, {
      id: data.id,
      slug: data.slug_id,
      location: data.location,
    });

    return NextResponse.json(
      {
        success: true,
        machine: {
          id: data.id,
          slug_id: data.slug_id,
          location: data.location,
          status: data.status,
          command: data.command,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in get machine by slug route:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
