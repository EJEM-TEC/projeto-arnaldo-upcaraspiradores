# Correção: Buscar Nome do Cliente na Dashboard

## Problema Identificado

Quando um ID de cliente era inserido na página de "Adicionar Crédito" da Dashboard, o nome do cliente não era buscado do banco de dados, ficando vazio ou mostrando "Cliente não encontrado".

## Causas

1. **Tabela `usuarios` não garantida**: A tabela `usuarios` não tinha uma migration oficial, podendo ter problemas de estrutura
2. **Campo `name` ausente ou nulo**: O campo `name` pode não estar criado ou estar vazio em registros antigos
3. **Falta de logs de debug**: Não havia informações suficientes sobre o que estava acontecendo

## Solução Implementada

### 1. Nova Migration: `008_ensure_usuarios_table.sql`

A migration garante:
- ✅ Tabela `usuarios` existe com estrutura completa
- ✅ Campo `name` está sempre presente e pode armazenar até 255 caracteres
- ✅ Índices para performance nas buscas por `id`, `email` e `role`
- ✅ Políticas RLS (Row Level Security) apropriadas:
  - Usuários podem ver seus próprios dados
  - Usuários podem atualizar seus próprios dados
  - Admins podem ver todos os usuários
  - Service role pode fazer gerenciamento completo
- ✅ Trigger automática para atualizar `updated_at`

### 2. Melhoria na Função `fetchClientName`

Adicionados:
- ✅ Logs detalhados de debug no console
- ✅ Melhor tratamento de erros com mensagens específicas
- ✅ Verificação explícita de valores antes de usar

## Como Aplicar

### Opção 1: Usar Supabase SQL Editor (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá para seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie o conteúdo do arquivo `supabase/migrations/008_ensure_usuarios_table.sql`
6. Cole na query
7. Clique em **Run**
8. Verifique a mensagem de sucesso

### Opção 2: Usar Supabase CLI

```bash
# Se você tem Supabase CLI instalado
npx supabase migration up

# Ou especificamente a migration 008
npx supabase db push
```

### Opção 3: Executar o SQL diretamente

No seu terminal Supabase ou aplicação backend que tenha acesso ao Supabase:

```sql
-- Copie e execute todo o conteúdo de:
-- supabase/migrations/008_ensure_usuarios_table.sql
```

## Verificação

Após aplicar a migration:

1. Na Dashboard, vá para **Adicionar Crédito**
2. Digite um ID de cliente válido no campo "ID do cliente"
3. O nome deve aparecer automaticamente no campo "Nome do cliente"
4. Abra o DevTools (F12) e veja o console para logs de debug

Se o nome não aparecer:
- Verifique se o usuário existe na tabela `usuarios`
- Verifique se o campo `name` está preenchido
- Veja os logs no console para mensagens de erro
- Execute a query SQL para verificar os dados:

```sql
SELECT id, email, name, role FROM public.usuarios LIMIT 10;
```

## Logs de Debug

Quando um ID é inserido, você verá logs como:

```
Fetched user profile: { 
  id: "abc-123...", 
  user: { 
    id: "abc-123...", 
    email: "cliente@email.com", 
    name: "João da Silva",
    role: "cliente"
  } 
}
Setting client name to: João da Silva
```

Se houver erro:

```
Error fetching client name: [detalhes do erro]
```

## Mudanças no Código

### Arquivo: `src/components/Dashboard.tsx`

```typescript
// Adicionado melhor logging e tratamento
const fetchClientName = async (id: string) => {
  // ... código ...
  console.log('Fetched user profile:', { id, user });
  console.log('Setting client name to:', displayName);
  // ... código ...
}
```

## Dados da Migration

- **Data**: 16 de novembro de 2025
- **Arquivo**: `supabase/migrations/008_ensure_usuarios_table.sql`
- **Commit**: f485eb8
- **Campos criados/validados**:
  - `id` (UUID) - Chave primária
  - `email` (VARCHAR 255) - Único
  - `name` (VARCHAR 255) - Agora garantidamente presente
  - `role` (VARCHAR 50) - Admin ou Cliente
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

## Próximas Melhorias

Considerações futuras:
- [ ] Cache de nomes de clientes para performance
- [ ] Busca por email também (não apenas ID)
- [ ] Validação de UUID vs ID numérico
- [ ] Interface de seleção de cliente em vez de apenas input
