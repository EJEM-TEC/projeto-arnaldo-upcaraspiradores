import { NextRequest, NextResponse } from 'next/server';
import { getUserBalance } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Busca o saldo atual do usuário
    const { data, error } = await getUserBalance(userId);

    if (error) {
      console.error('Error fetching user balance:', error);
      return NextResponse.json(
        { error: 'Error fetching balance', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: data?.saldo || 0,
    });
  } catch (error) {
    console.error('Error in verify-balance route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

