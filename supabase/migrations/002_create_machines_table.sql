-- Cria a tabela machines para controlar as máquinas de aspiração
CREATE TABLE IF NOT EXISTS public.machines (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'offline',
  command VARCHAR(10) DEFAULT 'off',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cria índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_machines_status ON public.machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_command ON public.machines(command);

-- Habilita Row Level Security
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ver todas as máquinas
CREATE POLICY "Authenticated users can view machines"
ON public.machines
FOR SELECT
TO authenticated
USING (true);

-- Política: Service role pode atualizar máquinas (pelo backend)
CREATE POLICY "Service role can update machines"
ON public.machines
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Cria a tabela activation_history para registrar ativações
CREATE TABLE IF NOT EXISTS public.activation_history (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  machine_id INTEGER NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  command VARCHAR(10) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  average_temperature DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'em_andamento',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cria índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_activation_history_machine_id ON public.activation_history(machine_id);
CREATE INDEX IF NOT EXISTS idx_activation_history_started_at ON public.activation_history(started_at);

-- Habilita Row Level Security
ALTER TABLE public.activation_history ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ver o histórico de ativações
CREATE POLICY "Authenticated users can view activation history"
ON public.activation_history
FOR SELECT
TO authenticated
USING (true);

-- Política: Service role pode inserir histórico de ativações
CREATE POLICY "Service role can insert activation history"
ON public.activation_history
FOR INSERT
TO service_role
WITH CHECK (true);

-- Política: Service role pode atualizar histórico de ativações
CREATE POLICY "Service role can update activation history"
ON public.activation_history
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Cria trigger para atualizar o updated_at das máquinas
CREATE OR REPLACE FUNCTION public.update_machines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_machines_updated_at ON public.machines;
CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON public.machines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_machines_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.machines IS 'Tabela de máquinas de aspiração';
COMMENT ON COLUMN public.machines.id IS 'ID único da máquina';
COMMENT ON COLUMN public.machines.location IS 'Localização da máquina';
COMMENT ON COLUMN public.machines.status IS 'Status da máquina (online, offline, etc)';
COMMENT ON COLUMN public.machines.command IS 'Comando atual (on ou off)';

COMMENT ON TABLE public.activation_history IS 'Histórico de ativações das máquinas';
COMMENT ON COLUMN public.activation_history.machine_id IS 'ID da máquina';
COMMENT ON COLUMN public.activation_history.command IS 'Comando executado (on ou off)';
COMMENT ON COLUMN public.activation_history.started_at IS 'Hora de início da ativação';
COMMENT ON COLUMN public.activation_history.ended_at IS 'Hora do término da ativação';
COMMENT ON COLUMN public.activation_history.duration_minutes IS 'Duração da ativação em minutos';
COMMENT ON COLUMN public.activation_history.status IS 'Status do histórico (em_andamento, concluído, etc)';
