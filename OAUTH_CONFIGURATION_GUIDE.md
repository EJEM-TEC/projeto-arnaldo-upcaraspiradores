# Guia de Configuração OAuth do Google - Supabase

## Problema Identificado
O login do Google está redirecionando para `localhost` em vez de `https://www.upaspiradores.com.br/home` porque as URIs de redirect não estão configuradas corretamente no Supabase.

## Passos para Configurar

### 1. Acessar o Painel Supabase
- Acesse: https://app.supabase.com
- Faça login com suas credenciais
- Selecione o projeto

### 2. Ir para Configurações de Autenticação
- No menu esquerdo, clique em **Authentication** (ou **Auth**)
- Clique em **Providers**
- Procure por **Google**

### 3. URLs de Redirect Necessárias
Adicione TODAS estas URLs na seção "Redirect URIs" do Google OAuth:

```
http://localhost:3000/auth/callback
http://localhost/auth/callback
https://www.upaspiradores.com.br/auth/callback
https://upaspiradores.com.br/auth/callback
```

### 4. Salvar Configurações
- Clique em **Save** após adicionar todas as URLs

### 5. Verificar Configuração do Google OAuth
Se você não vir as credenciais do Google:
1. Clique em **Google** (provider)
2. Você deve ver um campo com suas credenciais do Google OAuth
3. Se estiver vazio, adicione seu Google OAuth Client ID e Secret:
   - Client ID: `seu_client_id_aqui`
   - Client Secret: `seu_client_secret_aqui`

## Como Obter Google OAuth Credentials

1. Acesse: https://console.cloud.google.com
2. Crie um novo projeto ou selecione um existente
3. Vá para "OAuth 2.0 Client IDs"
4. Crie uma credencial do tipo "Web application"
5. Adicione as URIs autorizadas:
   ```
   http://localhost:3000
   http://localhost
   https://www.upaspiradores.com.br
   https://upaspiradores.com.br
   ```
6. Adicione as URIs de redirecionamento autorizadas:
   ```
   http://localhost:3000/auth/callback
   http://localhost/auth/callback
   https://www.upaspiradores.com.br/auth/callback
   https://upaspiradores.com.br/auth/callback
   ```
7. Copie o Client ID e Client Secret e adicione ao Supabase

## Verificação Final

Após configurar, teste com:
1. Abra: `https://www.upaspiradores.com.br/login` (ou `http://localhost:3000/login`)
2. Clique em "Login with Google"
3. Faça login com uma conta Google
4. Verifique se:
   - ✅ Redireciona para `https://www.upaspiradores.com.br/home` (não localhost)
   - ✅ Aparece no banco de dados na tabela `usuarios`
   - ✅ Tem role = 'cliente'
   - ✅ Tem saldo = 0 na tabela `profiles`

## Debug: Verificar Logs

Se ainda não funcionar:
1. Abra o console do navegador (F12)
2. Clique em Login with Google
3. Procure por erros em:
   - Aba **Console**
   - Aba **Network** (procure por `/auth/callback`)
   - Aba **Application > Cookies** (procure por `sb-` cookies)

## RLS Policies Necessárias

Verifique se as políticas de linha de segurança (RLS) do Supabase estão configuradas:

### Tabela `usuarios`:
```sql
-- Permitir que usuários autenticados vejam seus próprios dados
CREATE POLICY "Users can view own data"
ON usuarios
FOR SELECT
USING (auth.uid() = id);

-- Permitir que usuários autenticados criem sua própria linha
CREATE POLICY "Users can create own profile"
ON usuarios
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Permitir que usuários autenticados atualizem seus dados
CREATE POLICY "Users can update own data"
ON usuarios
FOR UPDATE
USING (auth.uid() = id);
```

### Tabela `profiles`:
```sql
-- Permitir que usuários autenticados vejam seu saldo
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Permitir que usuários autenticados criem seu perfil
CREATE POLICY "Users can create own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Permitir que usuários autenticados atualizem seu saldo
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);
```

## Resumo das Mudanças Realizadas

✅ Adicionado `NEXT_PUBLIC_APP_URL=https://www.upaspiradores.com.br` ao `.env.local`
✅ Melhorado logging no callback (`/auth/callback/route.ts`)
✅ Adicionado tratamento para Google user metadata (name/full_name)
✅ Build compila com sucesso

⏳ **PRÓXIMO PASSO**: Configurar URLs de redirect no console Supabase
