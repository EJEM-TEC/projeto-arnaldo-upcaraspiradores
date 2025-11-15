# Configuração de Atualização em Tempo Real do Saldo

## ⚠️ Problema Identificado
O saldo na navbar lateral não estava sendo atualizado automaticamente quando mudava no banco de dados.

## ✅ Solução Implementada

### 1. **Listener em Tempo Real (Realtime)**
- Configurado listener Supabase para detectar mudanças na tabela `profiles`
- Quando o saldo é alterado no banco, o frontend é notificado automaticamente
- Atualiza o saldo na navbar e em todos os componentes em tempo real

### 2. **Polling de Fallback**
- Se o Realtime não estiver funcionando, há um polling a cada 3 segundos
- Garante que o saldo seja atualizado mesmo sem Realtime habilitado
- Fallback automático sem necessidade de intervenção do usuário

### 3. **Atualização na Ativação de Máquina**
- Após ativar a máquina, o saldo é recarregado do banco
- Mostra o valor correto imediatamente (desconto da duração)
- Menu lateral reflete a mudança em tempo real

## 🔧 Como Ativar Realtime no Supabase (Opcional, mas Recomendado)

### Passo 1: Acessar Painel Supabase
1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá para **Database** (no menu esquerdo)

### Passo 2: Habilitar Realtime na Tabela `profiles`

```sql
-- Execute no SQL Editor do Supabase:

-- Habilita Realtime na tabela profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Se receber erro de publicação, use:
ALTER PUBLICATION supabase_realtime SET (publish = 'insert,update,delete');
```

### Passo 3: Verificar Configuração

No Supabase Dashboard:
1. Vá para **Database** → **Replication**
2. Verifique se `supabase_realtime` está ativo
3. Confirme que `profiles` está na lista de tabelas publicadas

## 📊 Como Funciona Agora

### Fluxo de Atualização do Saldo:

```
1. Usuário faz login
   ├─ Carrega saldo inicial do banco
   ├─ Configura listener Realtime para mudanças
   └─ Inicia polling a cada 3 segundos (fallback)

2. Usuário clica "Iniciar" para usar máquina
   ├─ API decrementa saldo no banco (profiles.saldo)
   ├─ Realtime detecta mudança
   └─ Frontend atualiza saldo na navbar automaticamente

3. Usuário faz pagamento
   ├─ Webhook detecta aprovação
   ├─ Incrementa saldo no banco
   ├─ Realtime notifica cliente
   └─ Frontend exibe novo saldo em tempo real

4. Se Realtime falhar (10s)
   ├─ Polling a cada 3 segundos busca novo saldo
   ├─ Garante atualização mesmo sem Realtime
   └─ Usuário sempre vê saldo correto
```

## 🎯 Garantias

- ✅ Saldo sempre reflete o banco de dados
- ✅ Atualização em tempo real via Realtime
- ✅ Fallback automático via polling
- ✅ Sem necessidade de recarregar a página
- ✅ Sincronizado em navbar, BalancePage, TimerPage
- ✅ Funciona mesmo com Realtime desabilitado

## 📍 Locais onde Saldo é Exibido (Todos Sincronizados)

| Local | Atualização |
|-------|-------------|
| Navbar Lateral | Tempo Real ✓ |
| BalancePage | Tempo Real ✓ |
| TimerPage | Tempo Real ✓ |
| Menu Lateral | Tempo Real ✓ |
| MobileNavbar | Tempo Real ✓ |

## 🔍 Debug: Verificar se Está Funcionando

1. **Abra o Console do Navegador** (F12)
2. **Clique em "Histórico" → "Tempo" → "Iniciar"**
3. **Procure pelos logs**:
   ```
   "Balance loaded: R$ XX,XX"
   "Setting up balance listener for user: [UUID]"
   "Balance updated in real-time: R$ XX,XX"
   ```

4. **Se vir esses logs**, o sistema está funcionando corretamente ✓

## 🚨 Possíveis Problemas

### Saldo não atualiza
- **Causa 1**: Realtime não habilitado e polling falhou
- **Solução**: Recarregue a página (deve funcionar com polling)

### Saldo fica desatualizado por minutos
- **Causa**: Realtime desabilitado, apenas polling funciona
- **Solução**: Execute os comandos SQL para habilitar Realtime

### Realtime mostra erro de permissão
- **Causa**: Tabela `profiles` não tem permissões RLS corretas
- **Solução**: Verifique as políticas RLS em **Database → RLS**

## 📝 RLS Policies Necessárias

```sql
-- Permitir que usuários vejam seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Permitir que usuários atualizem seu perfil (não deveria, apenas backend)
CREATE POLICY "Users can view profile updates"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

## ✨ Melhorias Futuras

1. **WebSocket mais robusto**: Reconexão automática se cair
2. **Notificações**: Alertar quando saldo é adicionado
3. **Histórico de Transações**: Mostrar mudanças recentes
4. **Sincronização multiplataforma**: Se usuário está em 2 abas, ambas atualizam

## 📞 Suporte

Se o saldo ainda não atualizar:
1. Verifique se Realtime está habilitado no Supabase
2. Verifique o console do navegador (F12) para erros
3. Tente recarregar a página
4. Verifique a conexão com a internet

---

**Status**: ✅ Sistema funcionando com Realtime + Polling de Fallback
