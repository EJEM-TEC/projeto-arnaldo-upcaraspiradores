/**
 * Script para popular a tabela profiles com saldo 0 para todos os usuários existentes
 * 
 * Execute com: node scripts/populate-profiles.js
 */

const { createClient } = require('@supabase/supabase-js');

// Tenta carregar variáveis de ambiente do .env.local se existir
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // Se dotenv não estiver disponível, usa process.env diretamente
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas.');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populateProfiles() {
  console.log('🔄 Iniciando população da tabela profiles...\n');

  try {
    // Busca todos os usuários
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    if (!users || users.users.length === 0) {
      console.log('ℹ️  Nenhum usuário encontrado.');
      return;
    }

    console.log(`📊 Encontrados ${users.users.length} usuário(s).\n`);

    // Busca perfis existentes
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError && profilesError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar perfis existentes:', profilesError);
      console.error('\n💡 Dica: Certifique-se de que a tabela profiles foi criada.');
      console.error('   Execute o SQL em supabase/migrations/001_create_profiles_table.sql\n');
      return;
    }

    const existingProfileIds = new Set(
      (existingProfiles || []).map(p => p.id)
    );

    // Filtra usuários que ainda não têm perfil
    const usersWithoutProfile = users.users.filter(
      user => !existingProfileIds.has(user.id)
    );

    if (usersWithoutProfile.length === 0) {
      console.log('✅ Todos os usuários já têm perfil criado.\n');
      return;
    }

    console.log(`📝 Criando perfis para ${usersWithoutProfile.length} usuário(s)...\n`);

    // Cria perfis com saldo 0
    const profilesToInsert = usersWithoutProfile.map(user => ({
      id: user.id,
      saldo: 0,
    }));

    const { data: insertedProfiles, error: insertError } = await supabase
      .from('profiles')
      .insert(profilesToInsert)
      .select();

    if (insertError) {
      console.error('❌ Erro ao criar perfis:', insertError);
      return;
    }

    console.log(`✅ ${insertedProfiles.length} perfil(is) criado(s) com sucesso!\n`);

    // Mostra resumo
    console.log('📊 Resumo:');
    console.log(`   - Total de usuários: ${users.users.length}`);
    console.log(`   - Perfis existentes: ${existingProfileIds.size}`);
    console.log(`   - Novos perfis criados: ${insertedProfiles.length}`);
    console.log(`   - Total de perfis agora: ${existingProfileIds.size + insertedProfiles.length}\n`);

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executa o script
populateProfiles()
  .then(() => {
    console.log('✨ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

