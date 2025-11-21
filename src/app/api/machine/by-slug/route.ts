import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return Response.json(
        { error: 'Slug é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`[API] Buscando máquina por slug: ${slug}`);

    const { data: machine, error } = await supabaseServer
      .from('machines')
      .select('*')
      .eq('slug_id', slug)
      .maybeSingle();

    if (error || !machine) {
      console.log(`[API] Máquina não encontrada: ${slug}`);
      return Response.json(
        { error: 'Máquina não encontrada', slug },
        { status: 404 }
      );
    }

    console.log(`[API] Máquina encontrada: ${machine.id}`);
    return Response.json({
      success: true,
      machine,
    });
  } catch (err) {
    console.error('[API] Erro:', err);
    return Response.json(
      { error: 'Erro ao buscar máquina' },
      { status: 500 }
    );
  }
}
