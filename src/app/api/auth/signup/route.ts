import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/auth/signup called');
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name' },
        { status: 400 }
      );
    }

    console.log(`🔐 Creating user account for: ${email}`);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: name,
      },
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    console.log(`👤 User created with ID: ${userId}`);

    // Create user profile in usuarios table
    const { error: profileError } = await supabaseServer
      .from('usuarios')
      .insert([
        {
          id: userId,
          email,
          name,
          created_at: new Date().toISOString(),
          role: 'cliente',
        },
      ]);

    if (profileError) {
      console.error('❌ Error creating user profile:', profileError);
      // If profile creation fails, still continue to create the balance profile
    } else {
      console.log(`✅ User profile created for: ${email}`);
    }

    // Create user balance profile with saldo = 0
    const { error: balanceError } = await supabaseServer
      .from('profiles')
      .upsert([
        {
          id: userId,
          saldo: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ], {
        onConflict: 'id'
      });

    if (balanceError) {
      console.error('❌ Error creating balance profile:', balanceError);
      return NextResponse.json(
        { error: 'Failed to initialize user balance' },
        { status: 500 }
      );
    }

    console.log(`💰 Balance profile created with saldo=0 for user: ${userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        userId,
        email,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Unexpected error in signup route:', error);
    return NextResponse.json(
      { error: 'Unexpected error during signup' },
      { status: 500 }
    );
  }
}
