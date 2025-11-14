-- Cria a tabela transactions para registrar transações financeiras
CREATE TABLE IF NOT EXISTS public.transactions (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description VARCHAR(500),
  payment_method VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cria índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- Habilita Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias transações
CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin');

-- Política: Service role pode inserir transações
CREATE POLICY "Service role can insert transactions"
ON public.transactions
FOR INSERT
TO service_role
WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE public.transactions IS 'Tabela de transações financeiras dos usuários';
COMMENT ON COLUMN public.transactions.user_id IS 'ID do usuário que fez a transação';
COMMENT ON COLUMN public.transactions.amount IS 'Valor da transação em inteiros';
COMMENT ON COLUMN public.transactions.type IS 'Tipo de transação (entrada ou saida)';
COMMENT ON COLUMN public.transactions.description IS 'Descrição da transação';
COMMENT ON COLUMN public.transactions.payment_method IS 'Método de pagamento usado';
