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

  // Cria o perfil na tabela profiles com saldo 0
  await ensureProfileExists(user.id);

  return { data, error: null };
}

// Garante que o perfil existe na tabela profiles com saldo 0
export async function ensureProfileExists(userId: string) {
  // Verifica se o perfil já existe
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  // Se não existe, cria com saldo 0
  if (!existingProfile && (!checkError || checkError.code === 'PGRST116')) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          saldo: 0,
        },
      ]);

    if (insertError) {
      // Se o erro for de duplicação, tudo bem (pode ter sido criado entre a verificação e a inserção)
      if (insertError.code !== '23505') {
        console.error('Error creating profile:', insertError);
        return { data: null, error: insertError };
      }
    } else {
      console.log(`Profile created for user ${userId} with saldo 0`);
    }
  }

  return { data: { id: userId, saldo: 0 }, error: null };
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

// Get user full name from profiles table
export async function getUserFullName(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('userid', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user full name:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<usuarios>) {
  const { data } = await supabase
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

// Profile balance functions
// Get user balance from profiles table
export async function getUserBalance(userId: string) {
  // Primeiro, garante que o perfil existe
  await ensureProfileExists(userId);

  const { data, error } = await supabase
    .from('profiles')
    .select('saldo')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    // Se a tabela não existir ou não houver registro, retorna saldo 0
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      return { data: { saldo: 0 }, error: null };
    }
    console.error('Error fetching user balance:', error);
    return { data: null, error };
  }

  return { data: data || { saldo: 0 }, error: null };
}

// Increment user balance (add amount to existing balance)
export async function incrementUserBalance(userId: string, amount: number) {
  // Primeiro, busca o saldo atual
  const { data: currentBalance, error: fetchError } = await getUserBalance(userId);
  
  if (fetchError) {
    console.error('Error fetching current balance:', fetchError);
    return { data: null, error: fetchError };
  }

  const currentSaldo = Math.round(currentBalance?.saldo || 0);
  const amountRounded = Math.round(amount);
  const newSaldo = Math.round(currentSaldo + amountRounded);

  // Atualiza ou cria o registro na tabela profiles
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      saldo: newSaldo, // Garantido como inteiro
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error incrementing user balance:', error);
    return { data: null, error };
  }

  console.log(`Balance incremented for user ${userId}: ${currentSaldo} + ${amount} = ${newSaldo}`);
  return { data, error: null };
}

// Update user balance (set absolute value)
export async function updateUserBalance(userId: string, saldo: number) {
  const saldoInt = Math.round(saldo); // Garante que seja inteiro
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      saldo: saldoInt, // Garantido como inteiro
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating user balance:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Machine-related functions
export interface Machine {
  id: number;
  location?: string;
  address?: string;
  status?: string;
  slug_id?: string;
  command?: string;
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

// Get machine by slug_id or ID
export async function getMachineBySlugOrId(slugOrId: string) {
  // Primeiro tenta como número (ID)
  const numSlug = parseInt(slugOrId, 10);
  if (!isNaN(numSlug)) {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('id', numSlug)
      .maybeSingle();
    
    if (data) return { data, error: null };
  }

  // Se não encontrou por ID, tenta por slug_id
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('slug_id', slugOrId.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('Error fetching machine by slug:', error);
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

// Machine command control functions
// Set machine command to 'on' or 'off'
export async function setMachineCommand(machineId: number, command: 'on' | 'off') {
  const { data, error } = await supabase
    .from('machines')
    .update({ 
      command: command,
      updated_at: new Date().toISOString()
    })
    .eq('id', machineId)
    .select()
    .single();

  if (error) {
    console.error(`Error setting machine ${machineId} command to ${command}:`, error);
    return { data: null, error };
  }

  console.log(`Machine ${machineId} command set to ${command}`);
  return { data, error: null };
}

// Get machine command status
export async function getMachineCommand(machineId: number) {
  const { data, error } = await supabase
    .from('machines')
    .select('command')
    .eq('id', machineId)
    .maybeSingle();

  if (error) {
    console.error(`Error getting machine ${machineId} command:`, error);
    return { data: null, error };
  }

  return { data: data?.command || 'off', error: null };
}

// Decrement user balance (subtract amount from balance)
export async function decrementUserBalance(userId: string, amount: number) {
  // Primeiro, busca o saldo atual
  const { data: currentBalance, error: fetchError } = await getUserBalance(userId);
  
  if (fetchError) {
    console.error('Error fetching current balance:', fetchError);
    return { data: null, error: fetchError };
  }

  // Garante que temos um valor numérico válido
  const currentSaldo = Math.round(parseFloat(String(currentBalance?.saldo || 0)));
  const amountRounded = Math.round(parseFloat(String(amount)));
  
  console.log(`[BALANCE DEBUG] User: ${userId}, Current: ${currentSaldo}, Amount: ${amountRounded}`);

  // Se saldo é insuficiente, retorna erro
  if (currentSaldo < amountRounded) {
    const error = new Error(`Saldo insuficiente: disponível R$ ${currentSaldo}, necessário R$ ${amountRounded}`);
    console.error(`[BALANCE ERROR] Insufficient balance for user ${userId}: current=${currentSaldo}, required=${amountRounded}`);
    return { data: null, error };
  }

  const newSaldo = Math.max(0, Math.round(currentSaldo - amountRounded)); // Não permite saldo negativo

  // Atualiza o saldo na tabela profiles
  const { data, error } = await supabase
    .from('profiles')
    .update({
      saldo: newSaldo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error decrementing user balance:', error);
    return { data: null, error };
  }

  console.log(`Balance decremented for user ${userId}: ${currentSaldo} - ${amount} = ${newSaldo}`);
  return { data, error: null };
}

// Get user activation history (máquinas que o usuário já usou)
export async function getUserActivationHistory(userId: string, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('activation_history')
      .select(`
        id,
        machine_id,
        started_at,
        ended_at,
        duration_minutes,
        cost,
        status,
        machines (
          id,
          location
        )
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user activation history:', error);
      // Se a coluna user_id não existe, retorna dados vazios (será criada na migração)
      if (error.message?.includes('column') || error.message?.includes('does not exist')) {
        return { data: [], error: null };
      }
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Unexpected error fetching user activation history:', err);
    return { data: null, error: err as Error };
  }
}

// Atualiza activation_history com user_id e cost quando a máquina é ativada
export async function updateActivationHistoryWithUser(
  activationId: number,
  userId: string,
  cost: number
) {
  try {
    const { data, error } = await supabase
      .from('activation_history')
      .update({
        user_id: userId,
        cost: Math.round(cost),
      })
      .eq('id', activationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating activation history with user:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error updating activation history:', err);
    return { data: null, error: err as Error };
  }
}

// ============================================
// SLUG FUNCTIONS
// ============================================

/**
 * Gera um slug único a partir da localização e ID da máquina
 * Exemplo: "salao-principal-1"
 */
/**
 * Gera um slug numérico aleatório de 6 dígitos
 * NOTA: No banco de dados, a geração é automática via trigger
 * Esta função é apenas para referência/teste
 */
export function generateRandomSlug(): string {
  const min = 100000;
  const max = 999999;
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNum.toString();
}

/**
 * Busca uma máquina pelo slug_id (6 dígitos) - função legada, use getMachineBySlugOrId
 */
export async function getMachineBySlug(slugId: string) {
  return getMachineBySlugOrId(slugId);
}

/**
 * Verifica se um slug já existe
 */
export async function isSlugExists(slugId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('machines')
      .select('id', { count: 'exact' })
      .eq('slug_id', slugId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (é ok)
      console.error('Error checking if slug exists:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('Unexpected error checking slug existence:', err);
    return false;
  }
}

// ============================================
// EXCEL IMPORTS FUNCTIONS
// ============================================

export interface ExcelImport {
  id: number;
  receita_posto: number;
  receita_app: number;
  receita_pix: number;
  receita_cartao: number;
  total_receita: number;
  imported_at: string;
  created_at: string;
}

export interface ExcelImportRow {
  id: number;
  import_id: number;
  equipamento: string;
  tempo_em_min: number;
  valor_por_aspira: number;
  quantidade: number;
  saldo_utilizado: number;
  valor_total: number;
  created_at: string;
}

// Get all Excel imports with their rows
export async function getExcelImports(limit: number = 50) {
  const { data, error } = await supabase
    .from('excel_imports')
    .select(`
      id,
      receita_posto,
      receita_app,
      receita_pix,
      receita_cartao,
      total_receita,
      imported_at,
      created_at,
      excel_import_rows (
        id,
        import_id,
        equipamento,
        tempo_em_min,
        valor_por_aspira,
        quantidade,
        saldo_utilizado,
        valor_total,
        created_at
      )
    `)
    .order('imported_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching Excel imports:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Get a specific Excel import with its rows
export async function getExcelImportById(importId: number) {
  const { data, error } = await supabase
    .from('excel_imports')
    .select(`
      id,
      receita_posto,
      receita_app,
      receita_pix,
      receita_cartao,
      total_receita,
      imported_at,
      created_at,
      excel_import_rows (
        id,
        import_id,
        equipamento,
        tempo_em_min,
        valor_por_aspira,
        quantidade,
        saldo_utilizado,
        valor_total,
        created_at
      )
    `)
    .eq('id', importId)
    .single();

  if (error) {
    console.error('Error fetching Excel import:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Get summary statistics from Excel imports
export async function getExcelImportSummary() {
  const { data, error } = await supabase
    .from('excel_imports')
    .select('total_receita, imported_at, created_at');

  if (error) {
    console.error('Error fetching import summary:', error);
    return { data: null, error };
  }

  // Calcular totais
  const totalReceita = (data || []).reduce((sum, item) => sum + (item.total_receita || 0), 0);
  const importCount = data?.length || 0;
  const lastImportDate = data?.[0]?.imported_at || null;

  return {
    data: {
      totalReceita,
      importCount,
      lastImportDate,
    },
    error: null,
  };
}