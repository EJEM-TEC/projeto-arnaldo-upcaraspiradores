import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action, notes } = body;

    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Request ID and valid action (approve/reject) are required' },
        { status: 400 }
      );
    }

    // Get current user (admin)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can approve/reject requests' },
        { status: 403 }
      );
    }

    // Get cancellation request
    const { data: cancellationRequest, error: fetchError } = await supabase
      .from('subscription_cancellation_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !cancellationRequest) {
      return NextResponse.json(
        { error: 'Cancellation request not found' },
        { status: 404 }
      );
    }

    if (cancellationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      );
    }

    // If approving, cancel the subscription in Mercado Pago
    if (action === 'approve') {
      try {
        const mpResponse = await fetch(
          `https://api.mercadopago.com/preapproval/${cancellationRequest.subscription_id}`,
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

        const mpResult = await mpResponse.json();

        if (!mpResponse.ok) {
          console.error('MercadoPago API error:', mpResult);
          return NextResponse.json(
            { error: 'Failed to cancel subscription in Mercado Pago' },
            { status: 500 }
          );
        }
      } catch (mpError) {
        console.error('Mercado Pago error:', mpError);
        return NextResponse.json(
          { error: 'Failed to cancel subscription' },
          { status: 500 }
        );
      }
    }

    // Update cancellation request
    const { data, error: updateError } = await supabase
      .from('subscription_cancellation_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cancellation request ${action === 'approve' ? 'approved' : 'rejected'}`,
      request: data,
    });
  } catch (error) {
    console.error('Error processing cancellation request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user (admin)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view all requests' },
        { status: 403 }
      );
    }

    // Get all pending cancellation requests
    const { data, error } = await supabase
      .from('subscription_cancellation_requests')
      .select(`
        *,
        user_id,
        profiles!subscription_cancellation_requests_user_id_fkey(email, full_name)
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requests: data,
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
