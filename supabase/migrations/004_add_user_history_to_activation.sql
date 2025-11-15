-- Adiciona coluna user_id à tabela activation_history para rastrear qual usuário usou a máquina
ALTER TABLE public.activation_history 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Cria índice para buscar histórico por usuário
CREATE INDEX IF NOT EXISTS idx_activation_history_user_id ON public.activation_history(user_id);

-- Cria índice composto para buscar histórico de um usuário em um período
CREATE INDEX IF NOT EXISTS idx_activation_history_user_started ON public.activation_history(user_id, started_at DESC);

-- Adiciona coluna cost para armazenar quanto foi debitado do saldo
ALTER TABLE public.activation_history 
ADD COLUMN IF NOT EXISTS cost INTEGER DEFAULT 0;

-- Política RLS: Usuários podem ver apenas seu próprio histórico (ou admins veem tudo)
DROP POLICY IF EXISTS "Authenticated users can view activation history" ON public.activation_history;

CREATE POLICY "Users can view own activation history"
ON public.activation_history
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
);

-- Comentários para documentação
COMMENT ON COLUMN public.activation_history.user_id IS 'ID do usuário que usou a máquina';
COMMENT ON COLUMN public.activation_history.cost IS 'Valor debitado do saldo do usuário em reais';
