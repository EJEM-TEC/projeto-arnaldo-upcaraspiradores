// Script to set up admin role for arnaldfirst@gmail.com
// Run this with: node setup-admin-role.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase credentials here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAdminRole() {
  try {
    console.log('Setting up admin role for arnaldfirst@gmail.com...');
    
    // First, let's check if the user exists
    const { data: users, error: fetchError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'arnaldfirst@gmail.com');

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return;
    }

    if (users && users.length > 0) {
      console.log('User found:', users[0]);
      
      // Update the user to have admin role
      const { data, error } = await supabase
        .from('usuarios')
        .update({ role: 'admin' })
        .eq('email', 'arnaldfirst@gmail.com')
        .select();

      if (error) {
        console.error('Error updating user role:', error);
      } else {
        console.log('Successfully set admin role for arnaldfirst@gmail.com');
        console.log('Updated user:', data[0]);
      }
    } else {
      console.log('User arnaldfirst@gmail.com not found in usuarios table');
      console.log('Make sure the user has signed up first');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

setupAdminRole();
