-- Tabela para armazenar importações Excel (resumo)
CREATE TABLE IF NOT EXISTS public.excel_imports (
  id BIGSERIAL PRIMARY KEY,
  receita_posto DECIMAL(10, 2) NOT NULL DEFAULT 0,
  receita_app DECIMAL(10, 2) NOT NULL DEFAULT 0,
  receita_pix DECIMAL(10, 2) NOT NULL DEFAULT 0,
  receita_cartao DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_receita DECIMAL(10, 2) NOT NULL DEFAULT 0,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_excel_imports_imported_at ON public.excel_imports(imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_excel_imports_created_at ON public.excel_imports(created_at DESC);

-- Tabela para armazenar os dados de equipamentos importados
CREATE TABLE IF NOT EXISTS public.excel_import_rows (
  id BIGSERIAL PRIMARY KEY,
  import_id BIGINT NOT NULL REFERENCES public.excel_imports(id) ON DELETE CASCADE,
  equipamento VARCHAR(255) NOT NULL,
  tempo_em_min INTEGER NOT NULL DEFAULT 0,
  valor_por_aspira DECIMAL(10, 2) NOT NULL DEFAULT 0,
  quantidade INTEGER NOT NULL DEFAULT 0,
  saldo_utilizado DECIMAL(10, 2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_excel_import_rows_import_id ON public.excel_import_rows(import_id);
CREATE INDEX IF NOT EXISTS idx_excel_import_rows_equipamento ON public.excel_import_rows(equipamento);
CREATE INDEX IF NOT EXISTS idx_excel_import_rows_created_at ON public.excel_import_rows(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.excel_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excel_import_rows ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para excel_imports
CREATE POLICY "Admins can view all imports"
ON public.excel_imports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Service role can access imports"
ON public.excel_imports
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Políticas RLS para excel_import_rows
CREATE POLICY "Admins can view all rows"
ON public.excel_import_rows
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Service role can access rows"
ON public.excel_import_rows
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_excel_imports_updated_at ON public.excel_imports;
CREATE TRIGGER update_excel_imports_updated_at
  BEFORE UPDATE ON public.excel_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_excel_import_rows_updated_at ON public.excel_import_rows;
CREATE TRIGGER update_excel_import_rows_updated_at
  BEFORE UPDATE ON public.excel_import_rows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
