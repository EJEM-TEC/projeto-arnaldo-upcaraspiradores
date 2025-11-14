-- Política para permitir admins atualizar perfil de outros usuários
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  -- Verifica se o usuário é admin
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  -- Verifica se o usuário é admin
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para permitir service_role atualizar qualquer perfil (útil para webhooks)
CREATE POLICY "Service role can update profiles"
ON public.profiles
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Política para permitir service_role selecionar perfis
CREATE POLICY "Service role can view profiles"
ON public.profiles
FOR SELECT
TO service_role
USING (true);
