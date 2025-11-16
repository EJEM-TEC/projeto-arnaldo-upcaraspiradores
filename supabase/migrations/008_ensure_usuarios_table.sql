-- Garante que a tabela usuarios existe com todos os campos necessários
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'cliente',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(email)
);

-- Adiciona coluna name se ela não existir
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Adiciona índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_id ON public.usuarios(id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON public.usuarios(role);

-- Habilita Row Level Security
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios dados
DROP POLICY IF EXISTS "Users can view own data" ON public.usuarios;
CREATE POLICY "Users can view own data"
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política: Usuários podem atualizar apenas seus dados
DROP POLICY IF EXISTS "Users can update own data" ON public.usuarios;
CREATE POLICY "Users can update own data"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política: Admins podem ver todos os usuários
DROP POLICY IF EXISTS "Admins can view all users" ON public.usuarios;
CREATE POLICY "Admins can view all users"
ON public.usuarios
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Política: Service role pode fazer tudo
DROP POLICY IF EXISTS "Service role can manage users" ON public.usuarios;
CREATE POLICY "Service role can manage users"
ON public.usuarios
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_usuarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_usuarios_updated_at();
