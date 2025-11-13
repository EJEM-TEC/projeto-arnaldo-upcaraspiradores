# Setup da Tabela Profiles

Este documento descreve como criar e configurar a tabela `profiles` no Supabase.

## 1. Criar a Tabela Profiles

Execute o seguinte SQL no SQL Editor do Supabase:

```sql
-- Cria a tabela profiles com campo saldo
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  saldo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cria índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Habilita Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política: Sistema pode inserir perfis (via service role)
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

## 2. Popular Perfis Existentes

Se você já tem usuários cadastrados, você pode popular os perfis de duas formas:

### Opção A: Usando SQL (Recomendado)

Execute este SQL no SQL Editor do Supabase:

```sql
-- Insere perfis para todos os usuários existentes que ainda não têm perfil
INSERT INTO public.profiles (id, saldo)
SELECT id, 0
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
```

### Opção B: Usando Script Node.js

Execute o script fornecido:

```bash
npm run populate-profiles
```

**Nota**: Certifique-se de que as variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configuradas no arquivo `.env.local`.

## 3. Verificar a Tabela

Para verificar se a tabela foi criada corretamente:

```sql
-- Ver estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Ver todos os perfis
SELECT * FROM public.profiles;
```

## 4. Como Funciona

- **Criação Automática**: Quando um novo usuário faz login pela primeira vez, um registro é criado automaticamente na tabela `profiles` com `saldo = 0`.

- **Incremento de Saldo**: Quando um pagamento é aprovado via webhook, o saldo é incrementado automaticamente na tabela `profiles`.

- **Valor Inteiro**: O campo `saldo` é do tipo `INTEGER`, garantindo que sempre seja um valor inteiro.

## 5. Troubleshooting

### Erro: "relation 'profiles' does not exist"
Execute o SQL do passo 1 para criar a tabela.

### Erro: "permission denied"
Verifique se as políticas RLS estão configuradas corretamente. Você pode temporariamente desabilitar RLS para testes:

```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

**⚠️ ATENÇÃO**: Desabilite RLS apenas para testes. Em produção, sempre mantenha RLS habilitado.

### Usuários existentes sem perfil
Execute o SQL do passo 2 para criar perfis para usuários existentes.

