-- Adiciona coluna slug_id na tabela machines
ALTER TABLE public.machines
ADD COLUMN IF NOT EXISTS slug_id VARCHAR(255) UNIQUE NOT NULL DEFAULT '';

-- Cria índice para melhor performance nas buscas por slug
CREATE INDEX IF NOT EXISTS idx_machines_slug_id ON public.machines(slug_id);

-- Criar função para gerar slug a partir da localização
CREATE OR REPLACE FUNCTION generate_machine_slug(location VARCHAR, machine_id INTEGER)
RETURNS VARCHAR AS $$
DECLARE
  base_slug VARCHAR;
  new_slug VARCHAR;
  counter INTEGER := 1;
BEGIN
  -- Remove espaços e caracteres especiais, converte para lowercase
  base_slug := LOWER(REGEXP_REPLACE(COALESCE(location, 'maquina'), '[^a-z0-9]+', '-', 'g'));
  base_slug := TRIM(base_slug, '-');
  
  -- Se estiver vazio, usa padrão
  IF base_slug = '' THEN
    base_slug := 'maquina';
  END IF;
  
  new_slug := base_slug || '-' || machine_id;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Atualizar máquinas existentes com slugs (se houver)
-- Descomente esta linha se houver dados existentes:
-- UPDATE public.machines SET slug_id = generate_machine_slug(location, id) WHERE slug_id = '';

-- Comentários para documentação
COMMENT ON COLUMN public.machines.slug_id IS 'Slug único para identificar a máquina via URL (ex: salao-principal-1)';
