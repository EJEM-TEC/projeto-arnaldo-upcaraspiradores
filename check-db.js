#!/usr/bin/env node
/**
 * Quick diagnostic script to check database state
 */

const fs = require('fs');
const path = require('path');

// Parse .env.local file
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function check() {
  console.log('🔍 Database Diagnostic\n');

  try {
    // Check usuarios table
    console.log('📋 Usuarios in database:');
    const { data: usuarios, error: usuariosError } = await supabaseServer
      .from('usuarios')
      .select('id, email, name')
      .limit(5);

    if (usuariosError) {
      console.error('❌ Error fetching usuarios:', usuariosError);
    } else {
      console.log(`   Found ${usuarios?.length || 0} usuarios`);
      usuarios?.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.name} (${u.email}) - ID: ${u.id.substring(0, 12)}...`);
      });
    }

    // Check profiles table
    console.log('\n📊 Profiles in database:');
    const { data: profiles, error: profilesError } = await supabaseServer
      .from('profiles')
      .select('id, saldo')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`   Found ${profiles?.length || 0} profiles`);
      profiles?.forEach((p, i) => {
        console.log(`   ${i + 1}. ID: ${p.id.substring(0, 12)}... | Saldo: R$ ${p.saldo}`);
      });
    }

    // Check machines table
    console.log('\n🤖 Machines in database:');
    const { data: machines, error: machinesError } = await supabaseServer
      .from('machines')
      .select('id, location, slug_id, command')
      .limit(5);

    if (machinesError) {
      console.error('❌ Error fetching machines:', machinesError);
    } else {
      console.log(`   Found ${machines?.length || 0} machines`);
      machines?.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.location} - Slug: ${m.slug_id} - Command: ${m.command}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

check();
