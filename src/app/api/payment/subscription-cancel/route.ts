import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Cancela a assinatura no Mercado Pago
    const response = await fetch(
      `https://api.mercadopago.com/preapproval/${subscriptionId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('MercadoPago API error:', result);
      return NextResponse.json(
        { error: result.message || 'Failed to cancel subscription' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscriptionId,
      status: result.status,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
