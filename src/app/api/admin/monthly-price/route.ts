import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { updateMonthlySubscriptionPrice, getMonthlySubscriptionPrice } from '@/lib/database';
// 1. Importe o tipo de erro oficial do Supabase
import { PostgrestError } from '@supabase/supabase-js';

export async function GET() {
  try {
    const { data, error } = await getMonthlySubscriptionPrice();
    
    if (error) {
      return NextResponse.json(
        // 2. Faça a asserção de tipo aqui
        { error: 'Erro ao buscar preço mensalista', details: (error as PostgrestError).message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { price: data?.price || 5 },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Unexpected error in get monthly price route:', error);
    return NextResponse.json(
      // 3. No catch genérico, converta para string ou use (error as Error).message
      { error: 'Erro ao processar solicitação', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { price } = body;

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return NextResponse.json(
        { error: 'Preço inválido. Deve ser um número positivo.' },
        { status: 400 }
      );
    }

    const priceValue = parseFloat(price);

    // Tenta atualizar usando a função do database
    const { data, error } = await updateMonthlySubscriptionPrice(priceValue);

    if (error) {
      // Se a tabela não existe, tenta criar usando service role
      console.log('Tabela app_settings não existe, criando registro via service role...');
      
      const { data: insertData, error: insertError } = await supabaseServer
        .from('app_settings')
        .upsert({
          key: 'monthly_subscription_price',
          value: priceValue.toString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating/updating monthly price:', insertError);
        return NextResponse.json(
          // 4. Faça a asserção de tipo aqui também
          { error: 'Erro ao atualizar preço mensalista', details: (insertError as PostgrestError).message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Preço mensalista atualizado com sucesso',
          price: priceValue,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Preço mensalista atualizado com sucesso',
        price: priceValue,
      },
      { status: 200 }
      );
  } catch (error) {
    console.error('❌ Unexpected error in update monthly price route:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação', details: String(error) },
      { status: 500 }
    );
  }
}