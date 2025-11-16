-- Adiciona coluna slug_id na tabela machines
ALTER TABLE public.machines
ADD COLUMN IF NOT EXISTS slug_id VARCHAR(6) UNIQUE NOT NULL DEFAULT '';

-- Cria índice para melhor performance nas buscas por slug
CREATE INDEX IF NOT EXISTS idx_machines_slug_id ON public.machines(slug_id);

-- Função para gerar slug aleatório de 6 dígitos (100000-999999)
CREATE OR REPLACE FUNCTION generate_random_slug()
RETURNS VARCHAR AS $$
DECLARE
  new_slug VARCHAR;
  slug_exists BOOLEAN := TRUE;
  attempts INTEGER := 0;
BEGIN
  -- Tenta gerar um slug único (máximo 100 tentativas)
  WHILE slug_exists AND attempts < 100 LOOP
    -- Gera número aleatório entre 100000 e 999999
    new_slug := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    
    -- Verifica se o slug já existe
    SELECT EXISTS(SELECT 1 FROM public.machines WHERE slug_id = new_slug) INTO slug_exists;
    
    attempts := attempts + 1;
  END LOOP;
  
  -- Se não conseguiu gerar um slug único, lança erro
  IF slug_exists THEN
    RAISE EXCEPTION 'Não foi possível gerar um slug único após 100 tentativas';
  END IF;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Função para ser chamada automaticamente ao inserir uma nova máquina
CREATE OR REPLACE FUNCTION set_machine_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Se slug_id não foi fornecido, gera automaticamente
  IF NEW.slug_id IS NULL OR NEW.slug_id = '' THEN
    NEW.slug_id := generate_random_slug();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar slug automaticamente ao inserir
DROP TRIGGER IF EXISTS trigger_set_machine_slug ON public.machines;
CREATE TRIGGER trigger_set_machine_slug
BEFORE INSERT ON public.machines
FOR EACH ROW
EXECUTE FUNCTION set_machine_slug();

-- Atualizar máquinas existentes com slugs aleatórios (se houver e estiverem vazios)
-- Descomente se houver dados existentes:
-- UPDATE public.machines SET slug_id = generate_random_slug() WHERE slug_id = '' OR slug_id IS NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.machines.slug_id IS 'Slug numérico único de 6 dígitos para identificar a máquina via URL (ex: 123456)';
