import { supabase } from './supabaseClient';

interface SupabaseErrorWithHint {
  code?: string;
  message: string;
  hint?: string;
  details?: string;
}

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
    .maybeSingle();

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
    .maybeSingle();

  if (error) {
    console.error('Error fetching user role:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Machine-related functions
export interface Machine {
  id: number;
  location?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Get all machines
export async function getAllMachines() {
  try {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching machines:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Se o erro for de tabela não encontrada, retorna array vazio
      const errorMessage = error.message || '';
      if (errorMessage.toLowerCase().includes('does not exist') || 
          errorMessage.toLowerCase().includes('relation') && errorMessage.toLowerCase().includes('not exist') ||
          error.code === '42P01') {
        console.warn('⚠️ Tabela "machines" não existe ou não está acessível. Verifique as permissões RLS.');
        return { data: [], error: null };
      }
      
      return { data: null, error };
    }

    console.log('Machines fetched successfully:', data?.length || 0, 'machines');
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Unexpected error in getAllMachines:', err);
    return { data: null, error: err as Error };
  }
}

// Get machine by ID
export async function getMachineById(machineId: number) {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('id', machineId)
    .single();

  if (error) {
    console.error('Error fetching machine:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Activation History functions
export interface ActivationHistory {
  id: number;
  machine_id: number;
  command: string; // 'on' ou 'off'
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  average_temperature?: number; // Temperatura média durante a execução
  status: string; // 'concluído', 'em_andamento', etc
  created_at: string;
}

// Get all activation history (optional date filters)
export async function getAllActivationHistory(startDate?: string, endDate?: string) {
  let query = supabase
    .from('activation_history')
    .select('*')
    .order('started_at', { ascending: false });

  if (startDate) query = query.gte('started_at', startDate);
  if (endDate) query = query.lte('started_at', endDate);

  const { data: historyData, error: historyError } = await query;

  if (historyError) {
    console.error('Error fetching activation history:', historyError);
    return { data: null, error: historyError };
  }

  if (!historyData || historyData.length === 0) {
    return { data: [], error: null };
  }

  const machineIds = [...new Set(historyData.map(h => h.machine_id))];
  const { data: machinesData } = await supabase
    .from('machines')
    .select('id, location')
    .in('id', machineIds);

  const machinesMap = new Map();
  if (machinesData) {
    machinesData.forEach(m => machinesMap.set(m.id, m));
  }

  const combinedData = historyData.map(activation => ({
    ...activation,
    machines: machinesMap.get(activation.machine_id) || null
  }));

  return { data: combinedData, error: null };
}

export async function getMachineStats(machineId: number) {
  // total de acionamentos e soma de minutos
  const { data, error } = await supabase
    .from('activation_history')
    .select('duration_minutes, id')
    .eq('machine_id', machineId);

  if (error) {
    console.error('Error fetching machine stats:', error);
    return { data: null, error };
  }

  const totalActivations = data?.length || 0;
  const totalUsageMinutes = (data || []).reduce((sum, r) => sum + (r.duration_minutes || 0), 0);

  // última limpeza e voltagem podem não existir no schema; tentar buscar se houver
  const { data: machineData } = await supabase
    .from('machines')
    .select('voltage, last_cleaning, created_at')
    .eq('id', machineId)
    .single();

  return {
    data: {
      totalActivations,
      totalUsageMinutes,
      voltage: machineData?.voltage ?? null,
      last_cleaning: machineData?.last_cleaning ?? null,
      created_at: machineData?.created_at ?? null,
    },
    error: null,
  };
}

// Get activation history by machine ID
export async function getActivationHistoryByMachine(machineId: number) {
  const { data, error } = await supabase
    .from('activation_history')
    .select('*')
    .eq('machine_id', machineId)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('Error fetching activation history by machine:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Create activation history record
export async function createActivationHistory(activation: {
  machine_id: number;
  command: string;
  started_at: string;
  status?: string;
}) {
  const { data, error } = await supabase
    .from('activation_history')
    .insert([
      {
        machine_id: activation.machine_id,
        command: activation.command,
        started_at: activation.started_at,
        status: activation.status || 'em_andamento',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating activation history:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Update activation history (to set end time and duration)
export async function updateActivationHistory(
  id: number,
  updates: {
    ended_at?: string;
    duration_minutes?: number;
    average_temperature?: number;
    status?: string;
  }
) {
  const { data, error } = await supabase
    .from('activation_history')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating activation history:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Transaction/Cash History functions
export interface Transaction {
  id: number;
  user_id?: string; // UUID do usuário/cliente (opcional)
  amount: number;
  type: 'entrada' | 'saida'; // 'entrada' para créditos, 'saida' para despesas
  description: string;
  payment_method?: string; // 'credit-card', 'debit-card', 'pix', etc
  created_at: string;
}

// Create a new transaction
export async function createTransaction(transaction: {
  user_id?: string;
  amount: number;
  type: 'entrada' | 'saida';
  description: string;
  payment_method?: string;
}) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        user_id: transaction.user_id || null,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        payment_method: transaction.payment_method || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Get all transactions
export async function getAllTransactions() {
  // Primeiro, busca as transações
  const { data: transactionsData, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (transactionsError) {
    // Verifica se a tabela não existe (várias formas que o Supabase pode retornar)
    const errorMessage = transactionsError.message || JSON.stringify(transactionsError);
    const errorWithHint = transactionsError as SupabaseErrorWithHint;
    const errorCode = transactionsError.code || errorWithHint.hint;
    
    if (errorCode === '42P01' || 
        errorMessage?.toLowerCase().includes('does not exist') ||
        errorMessage?.toLowerCase().includes('relation') && errorMessage?.toLowerCase().includes('not exist') ||
        errorMessage?.toLowerCase().includes('no existe') ||
        errorMessage?.includes('relation "transactions" does not exist')) {
      console.warn('⚠️ Tabela "transactions" não existe ainda. Crie a tabela conforme instruções em TRANSACTIONS_SETUP.md');
      console.warn('O sistema continuará funcionando, mas não haverá dados de histórico de caixa até a tabela ser criada.');
      return { data: [], error: null };
    }
    
    console.error('❌ Error fetching transactions:', {
      message: transactionsError.message,
      code: transactionsError.code,
      details: transactionsError,
      fullError: transactionsError
    });
    return { data: null, error: transactionsError };
  }

  // Se não houver dados, retorna vazio
  if (!transactionsData || transactionsData.length === 0) {
    return { data: [], error: null };
  }

  // Busca os usuários relacionados
  const userIds = transactionsData
    .map(t => t.user_id)
    .filter(id => id !== null && id !== undefined) as string[];

  const usersMap = new Map();
  if (userIds.length > 0) {
    const uniqueUserIds = [...new Set(userIds)];
    const { data: usersData, error: usersError } = await supabase
      .from('usuarios')
      .select('id, email, name')
      .in('id', uniqueUserIds);

    if (!usersError && usersData) {
      usersData.forEach(u => usersMap.set(u.id, u));
    }
  }

  // Combina os dados
  const combinedData = transactionsData.map(transaction => ({
    ...transaction,
    usuarios: transaction.user_id ? usersMap.get(transaction.user_id) || null : null
  }));

  return { data: combinedData, error: null };
}

// Get transactions summary (total entries and exits)
export async function getTransactionsSummary(startDate?: string, endDate?: string) {
  let query = supabase
    .from('transactions')
    .select('type, amount');

  // Se houver filtro de data, aplicar
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    // Verifica se a tabela não existe (várias formas que o Supabase pode retornar)
    const errorMessage = error.message || JSON.stringify(error);
    const errorWithHint = error as SupabaseErrorWithHint;
    const errorCode = error.code || errorWithHint.hint;
    
    if (errorCode === '42P01' || 
        errorMessage?.toLowerCase().includes('does not exist') ||
        errorMessage?.toLowerCase().includes('relation') && errorMessage?.toLowerCase().includes('not exist') ||
        errorMessage?.toLowerCase().includes('no existe') ||
        errorMessage?.includes('relation "transactions" does not exist')) {
      console.warn('⚠️ Tabela "transactions" não existe ainda. Crie a tabela conforme instruções em TRANSACTIONS_SETUP.md');
      return { data: { entries: 0, exits: 0 }, error: null };
    }
    
    console.error('❌ Error fetching transactions summary:', {
      message: error.message,
      code: error.code,
      details: error,
      fullError: error
    });
    return { data: null, error };
  }

  if (!data) {
    return { data: { entries: 0, exits: 0 }, error: null };
  }

  const entries = data
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const exits = data
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return { data: { entries, exits }, error: null };
}

// Get transactions by user
export async function getTransactionsByUser(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user transactions:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Billing/Faturamento functions
export interface BillingData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  transactions: Transaction[];
  byPaymentMethod: Record<string, number>;
  byUser: Array<{ user_id: string; amount: number; name?: string }>;
}

// Get billing data for a specific period
export async function getBillingData(startDate: string, endDate: string) {
  const query = supabase
    .from('transactions')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    // Se a tabela não existe, retorna dados zerados
    const errorMessage = error.message || JSON.stringify(error);
    const errorWithHint = error as SupabaseErrorWithHint;
    const errorCode = error.code || errorWithHint.hint;
    
    if (errorCode === '42P01' || 
        errorMessage?.toLowerCase().includes('does not exist') ||
        errorMessage?.toLowerCase().includes('relation') && errorMessage?.toLowerCase().includes('not exist')) {
      return { 
        data: {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          transactionCount: 0,
          transactions: [],
          byPaymentMethod: {},
          byUser: []
        }, 
        error: null 
      };
    }
    
    console.error('Error fetching billing data:', error);
    return { data: null, error };
  }

  if (!data || data.length === 0) {
    return {
      data: {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        transactionCount: 0,
        transactions: [],
        byPaymentMethod: {},
        byUser: []
      },
      error: null
    };
  }

  const revenue = data
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const expenses = data
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Agrupar por método de pagamento
  const byPaymentMethod: Record<string, number> = {};
  data.forEach(t => {
    if (t.type === 'entrada') {
      const method = t.payment_method || 'outros';
      byPaymentMethod[method] = (byPaymentMethod[method] || 0) + (t.amount || 0);
    }
  });

  // Agrupar por usuário
  const byUserMap = new Map<string, number>();
  data.forEach(t => {
    if (t.type === 'entrada' && t.user_id) {
      const userId = t.user_id;
      byUserMap.set(userId, (byUserMap.get(userId) || 0) + (t.amount || 0));
    }
  });

  // Buscar nomes dos usuários
  const userIds = Array.from(byUserMap.keys());
  const byUser: Array<{ user_id: string; amount: number; name?: string }> = [];
  
  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from('usuarios')
      .select('id, name, email')
      .in('id', userIds);

    if (usersData) {
      usersData.forEach(u => {
        byUser.push({
          user_id: u.id,
          amount: byUserMap.get(u.id) || 0,
          name: u.name || u.email || 'Usuário'
        });
      });
    }
  }

  // Ordenar por valor
  byUser.sort((a, b) => b.amount - a.amount);

  return {
    data: {
      totalRevenue: revenue,
      totalExpenses: expenses,
      netProfit: revenue - expenses,
      transactionCount: data.length,
      transactions: data,
      byPaymentMethod,
      byUser: byUser.slice(0, 10) // Top 10 clientes
    },
    error: null
  };
}

// Get monthly billing summary
export async function getMonthlyBilling(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
  return getBillingData(startDate, endDate);
}