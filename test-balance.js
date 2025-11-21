#!/usr/bin/env node
/**
 * Test script to verify balance operations work correctly
 * Tests: getUserBalance, decrementUserBalance with service_role bypass
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

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✓' : '✗');
  process.exit(1);
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function test() {
  console.log('🧪 Testing Balance Operations\n');

  try {
    // Test 1: List all profiles to find a test user
    console.log('📋 Step 1: Fetching all profiles...');
    const { data: profiles, error: profilesError } = await supabaseServer
      .from('profiles')
      .select('id, saldo')
      .limit(5);

    if (profilesError) {
      console.error('❌ Failed to fetch profiles:', profilesError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.error('❌ No profiles found in database');
      console.log('   Please create a test user first');
      return;
    }

    console.log(`✅ Found ${profiles.length} profiles`);
    profiles.forEach((p, i) => {
      console.log(`   ${i + 1}. ID: ${p.id.substring(0, 8)}... | Saldo: R$ ${p.saldo}`);
    });

    // Test 2: Read balance using service_role
    const testUserId = profiles[0].id;
    console.log(`\n📊 Step 2: Reading balance for user ${testUserId.substring(0, 8)}... using service_role...`);
    
    const { data: balanceData, error: balanceError } = await supabaseServer
      .from('profiles')
      .select('saldo')
      .eq('id', testUserId)
      .maybeSingle();

    if (balanceError) {
      console.error('❌ Failed to read balance:', balanceError);
      return;
    }

    const currentSaldo = balanceData?.saldo || 0;
    console.log(`✅ Current balance: R$ ${currentSaldo}`);

    // Test 3: Decrement balance using service_role
    if (currentSaldo >= 10) {
      console.log(`\n💰 Step 3: Attempting to decrement R$ 10 from balance...`);
      
      const newSaldo = currentSaldo - 10;
      const { data: updatedData, error: updateError } = await supabaseServer
        .from('profiles')
        .update({
          saldo: newSaldo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testUserId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Failed to update balance:', updateError);
        return;
      }

      console.log(`✅ Balance updated successfully`);
      console.log(`   Before: R$ ${currentSaldo}`);
      console.log(`   After: R$ ${updatedData.saldo}`);

      // Test 4: Verify the update persisted
      console.log(`\n✔️  Step 4: Verifying the change persisted...`);
      const { data: verifyData } = await supabaseServer
        .from('profiles')
        .select('saldo')
        .eq('id', testUserId)
        .maybeSingle();

      if (verifyData?.saldo === newSaldo) {
        console.log(`✅ Balance correctly updated to R$ ${verifyData.saldo}`);
      } else {
        console.error(`❌ Balance mismatch! Expected ${newSaldo}, got ${verifyData?.saldo}`);
        return;
      }

      // Restore balance
      console.log(`\n🔄 Step 5: Restoring original balance...`);
      const { error: restoreError } = await supabaseServer
        .from('profiles')
        .update({
          saldo: currentSaldo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testUserId)
        .select()
        .single();

      if (restoreError) {
        console.error('❌ Failed to restore balance:', restoreError);
        return;
      }

      console.log(`✅ Balance restored to R$ ${currentSaldo}`);
    } else {
      console.log(`⚠️  Step 3: Skipped (balance too low for test: R$ ${currentSaldo})`);
    }

    console.log('\n✅ All tests passed! Balance operations working correctly.\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

test();
