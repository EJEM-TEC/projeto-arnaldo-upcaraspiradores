import { supabase } from './supabaseClient';

export interface usuarios {
  id: string;
  created_at: string;
  email: string;
  name: string;
  role?: string; // Optional role field
}

// Create a new user profile in the database
export async function createUserProfile(user: {
  id: string;
  email: string;
  created_at: string;
  name: string;
}) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert([
      {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        name: user.name,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Get user profile from database
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<usuarios>) {
  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  return { data, error: null };
}

// Set user role (admin or cliente)
export async function setUserRole(userId: string, role: 'admin' | 'cliente') {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error setting user role:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Get user role
export async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user role:', error);
    return { data: null, error };
  }

  return { data, error: null };
}
