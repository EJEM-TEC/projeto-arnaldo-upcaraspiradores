# Configuração de RLS (Row Level Security) no Supabase

## Problema: Máquinas não aparecem na página de equipamentos

Se você tem máquinas cadastradas no banco mas elas não aparecem na interface, o problema provavelmente é **RLS (Row Level Security)** bloqueando o acesso.

## Como verificar e corrigir:

### 1. Verificar se a tabela existe e tem dados

Execute no SQL Editor do Supabase:

```sql
-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'machines';

-- Verificar quantas máquinas existem
SELECT COUNT(*) FROM machines;

-- Ver todas as máquinas
SELECT * FROM machines;
```

### 2. Verificar políticas RLS ativas

```sql
-- Ver todas as políticas RLS da tabela machines
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'machines';
```

### 3. Criar/Atualizar políticas RLS para permitir leitura

**Opção A: Permitir leitura para usuários autenticados (RECOMENDADO)**

```sql
-- Habilitar RLS na tabela
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura de máquinas para usuários autenticados"
ON machines
FOR SELECT
TO authenticated
USING (true);

-- Criar política para permitir inserção para usuários autenticados (admin)
CREATE POLICY "Permitir inserção de máquinas para usuários autenticados"
ON machines
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Criar política para permitir atualização para usuários autenticados (admin)
CREATE POLICY "Permitir atualização de máquinas para usuários autenticados"
ON machines
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

**Opção B: Desabilitar RLS temporariamente (apenas para testes)**

```sql
-- ATENÇÃO: Isso remove todas as restrições de segurança!
-- Use apenas para testes de desenvolvimento
ALTER TABLE machines DISABLE ROW LEVEL SECURITY;
```

**Opção C: Permitir acesso público (NÃO RECOMENDADO para produção)**

```sql
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a máquinas"
ON machines
FOR ALL
TO public
USING (true)
WITH CHECK (true);
```

### 4. Verificar estrutura da tabela

```sql
-- Ver estrutura completa da tabela machines
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'machines'
ORDER BY ordinal_position;
```

### 5. Criar tabela se não existir

Se a tabela não existir, execute:

```sql
CREATE TABLE IF NOT EXISTS public.machines (
  id bigserial PRIMARY KEY,
  location text,
  status text DEFAULT 'ativo',
  voltage text,
  last_cleaning timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- Criar políticas (copie da Opção A acima)
CREATE POLICY "Permitir leitura de máquinas para usuários autenticados"
ON machines
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserção de máquinas para usuários autenticados"
ON machines
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir atualização de máquinas para usuários autenticados"
ON machines
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

## Como testar:

1. Abra o console do navegador (F12)
2. Vá para a aba "Equipamentos" no dashboard
3. Veja os logs no console:
   - `Resultado getAllMachines:` - deve mostrar `data` e `error`
   - `Machines fetched successfully:` - deve mostrar quantas máquinas foram encontradas
   - Se houver erro, veja `Detalhes do erro:` para informações específicas

## Erros comuns:

- **"relation does not exist"**: A tabela não existe. Execute o SQL de criação acima.
- **"permission denied"**: RLS está bloqueando. Execute as políticas acima.
- **"new row violates row-level security policy"**: A política de inserção está bloqueando. Verifique as políticas de INSERT.

## Verificar permissões do usuário atual:

```sql
-- Ver qual usuário está autenticado
SELECT auth.uid() as user_id;

-- Ver se o usuário tem permissão de leitura
SELECT * FROM machines LIMIT 1;
```

