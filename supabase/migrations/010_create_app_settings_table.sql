-- Cria a tabela app_settings para armazenar configurações da aplicação
CREATE TABLE IF NOT EXISTS public.app_settings (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cria índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);

-- Habilita Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver configurações
CREATE POLICY "Admins can view app settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING ((SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin');

-- Política: Apenas admins podem atualizar configurações
CREATE POLICY "Admins can update app settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING ((SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin');

-- Política: Service role pode inserir/atualizar configurações
CREATE POLICY "Service role can manage app settings"
ON public.app_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_app_settings_updated_at();

-- Insere o preço mensalista padrão se não existir
INSERT INTO public.app_settings (key, value)
VALUES ('monthly_subscription_price', '5')
ON CONFLICT (key) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE public.app_settings IS 'Tabela de configurações da aplicação';
COMMENT ON COLUMN public.app_settings.key IS 'Chave única da configuração';
COMMENT ON COLUMN public.app_settings.value IS 'Valor da configuração em texto';
COMMENT ON COLUMN public.app_settings.updated_at IS 'Data da última atualização';

