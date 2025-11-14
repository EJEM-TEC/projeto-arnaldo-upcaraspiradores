# Comandos SQL para Configurar Histórico de Máquinas

Execute os comandos abaixo no Supabase SQL Editor para ativar o histórico de utilização de máquinas.

## 1. Adicionar Colunas de Rastreamento à Tabela `activation_history`

```sql
-- Adiciona coluna user_id à tabela activation_history para rastrear qual usuário usou a máquina
ALTER TABLE public.activation_history 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adiciona coluna cost para armazenar quanto foi debitado do saldo
ALTER TABLE public.activation_history 
ADD COLUMN IF NOT EXISTS cost INTEGER DEFAULT 0;
```

## 2. Criar Índices para Performance

```sql
-- Cria índice para buscar histórico por usuário
CREATE INDEX IF NOT EXISTS idx_activation_history_user_id ON public.activation_history(user_id);

-- Cria índice composto para buscar histórico de um usuário em um período
CREATE INDEX IF NOT EXISTS idx_activation_history_user_started ON public.activation_history(user_id, started_at DESC);
```

## 3. Atualizar Políticas de Row Level Security (RLS)

```sql
-- Remove a política antiga
DROP POLICY IF EXISTS "Authenticated users can view activation history" ON public.activation_history;

-- Cria nova política: Usuários podem ver apenas seu próprio histórico (ou admins veem tudo)
CREATE POLICY "Users can view own activation history"
ON public.activation_history
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
);
```

## 4. Adicionar Comentários para Documentação

```sql
-- Comentários para documentação
COMMENT ON COLUMN public.activation_history.user_id IS 'ID do usuário que usou a máquina';
COMMENT ON COLUMN public.activation_history.cost IS 'Valor debitado do saldo do usuário em reais';
```

---

## Resumo do Que Será Armazenado

Após executar os comandos acima, cada uso de máquina será registrado com:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INTEGER | ID único do registro |
| `machine_id` | INTEGER | ID da máquina usada |
| `user_id` | UUID | ID do usuário que usou |
| `started_at` | TIMESTAMP | Quando começou a usar |
| `ended_at` | TIMESTAMP | Quando terminou de usar |
| `duration_minutes` | INTEGER | Quantos minutos usou |
| `cost` | INTEGER | Quanto foi debitado do saldo |
| `command` | VARCHAR | 'on' para ativação, 'off' para desativação |
| `status` | VARCHAR | 'em_andamento' ou 'concluído' |
| `created_at` | TIMESTAMP | Quando o registro foi criado |

---

## Exemplo de Dados Armazenados

```sql
-- Exemplo de um uso de máquina que será armazenado:
INSERT INTO activation_history 
  (machine_id, user_id, command, started_at, ended_at, duration_minutes, cost, status)
VALUES 
  (1, 'user-uuid-123', 'on', '2024-01-15 14:30:00', '2024-01-15 14:55:00', 25, 25, 'concluído');

-- Resultado: Cliente usou a máquina #1 por 25 minutos e pagou R$25 do saldo
```

---

## Teste o Histórico

Após executa os comandos SQL:

1. Faça login no aplicativo
2. Clique em "Tempo" e selecione uma duração (ex: 10 minutos)
3. Clique em "Iniciar"
4. Aguarde o timer terminar (ou feche a página)
5. Clique em "Histórico"
6. Você deve ver o registro da máquina que usou, com:
   - ID do aspirador
   - Data e hora
   - Valor debitado
   - Duração em minutos

---

## API Endpoints

### GET `/api/history/user?userId={userId}&limit=50`

Retorna o histórico de uso de máquinas do usuário.

**Response:**
```json
{
  "userId": "user-uuid-123",
  "history": [
    {
      "id": 1,
      "machine_id": 1,
      "machine_location": "Aspirador #1",
      "started_at": "2024-01-15T14:30:00.000Z",
      "ended_at": "2024-01-15T14:55:00.000Z",
      "duration_minutes": 25,
      "cost": 25,
      "status": "concluído",
      "formatted_date": "15/01/2024 14:30"
    }
  ],
  "total": 1
}
```

---

## Status da Implementação

- ✅ Tabela `activation_history` com colunas `user_id` e `cost`
- ✅ Índices criados para performance
- ✅ Políticas RLS atualizadas
- ✅ API `/api/history/user` para buscar histórico
- ✅ Componente `HistoryPage` atualizado para exibir dados reais
- ✅ Rota `/api/machine/activate` salva `user_id` e `cost` no histórico

## Funcionalidades Disponíveis

1. **Visualizar Histórico**: Clique em "Histórico" para ver todas as máquinas que usou
2. **Filtrar por Período**: (A implementar se necessário)
3. **Ver Detalhes**: Cada uso mostra:
   - ID do aspirador
   - Data e hora
   - Valor debitado
   - Duração em minutos
   - Status (concluído, em andamento, etc)

---

**Nota**: Os comandos SQL foram criados com `IF NOT EXISTS` para serem idempotentes - podem ser executados várias vezes sem causar erros.
