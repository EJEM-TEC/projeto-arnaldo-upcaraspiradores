-- Adiciona o campo de endereço à tabela machines
ALTER TABLE public.machines
ADD COLUMN IF NOT EXISTS address VARCHAR(255);

-- Cria índice para endereço (útil para filtros)
CREATE INDEX IF NOT EXISTS idx_machines_address ON public.machines(address);
