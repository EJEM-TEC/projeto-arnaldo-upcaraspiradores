# Guia de Setup e Implementação

## Resumo das Alterações

### 1. Google Login / OAuth
✅ **Corrigido**: O redirecionamento agora usa `https://www.upaspiradores.com.br` em produção
- Arquivo: `src/app/auth/callback/route.ts`
- Agora salva automaticamente os dados do usuário no banco de dados

### 2. Acesso Admin
✅ **Implementado**: Admins agora podem acessar TANTO o painel de controle (`/painel_de_controle`) QUANTO o site normal (`/home`)
- Arquivo: `src/middleware.ts`
- Admins mantêm acesso total a ambas as rotas

### 3. Sistema de Saldo
✅ **Implementado**: Sistema completo de saldo de usuários
- Saldo é armazenado na tabela `profiles` (em inteiros, reais)
- Quando um pagamento é aprovado, o saldo é incrementado automaticamente
- Webhook do Mercado Pago atualiza o saldo em tempo real

### 4. Exibição de Saldo
✅ **Implementado**: Saldo é exibido em tempo real na interface
- Arquivo: `src/components/mobile/MobileDashboard.tsx`
- Carrega saldo ao entrar e atualiza quando pagamento é feito

### 5. Verificação de Saldo antes de Usar Máquina
✅ **Implementado**: Sistema verifica se saldo é suficiente
- Arquivo: `src/components/mobile/TimerPage.tsx`
- Mostra aviso em vermelho se saldo for insuficiente
- Botão "INICIAR" é desabilitado sem saldo suficiente

### 6. Ativação/Desativação de Máquina com Desconto de Saldo
✅ **Implementado**: Quando usuário inicia timer:
1. API `/api/machine/activate` verifica saldo
2. Se saldo OK, decrementa o valor do saldo
3. Atualiza comando da máquina para 'on'
4. Cria registro de ativação no histórico

### 7. Timer com Countdown
✅ **Implementado**: Timer visual com countdown em tempo real
- Arquivo: `src/components/mobile/TimerPage.tsx`
- Faz countdown a cada segundo

### 8. Desativação Automática
✅ **Implementado**: Quando timer acaba:
1. Atualiza comando da máquina para 'off'
2. Atualiza registro de ativação com hora de término
3. Mostra alerta ao usuário

## Configuração Necessária

### Migrations do Supabase
Execute as migrations na ordem:
1. `001_create_profiles_table.sql` - Já existia
2. `002_create_machines_table.sql` - NOVA
3. `003_create_transactions_table.sql` - NOVA

### Variáveis de Ambiente
Certifique-se que estão configuradas em `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://wtypmtaviwvzouxtqxsv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Google OAuth
Configure em: https://supabase.com/dashboard/project/wtypmtaviwvzouxtqxsv/auth/providers

Authorized Redirect URLs devem incluir:
- `https://www.upaspiradores.com.br/auth/callback`
- `http://localhost:3000/auth/callback` (para desenvolvimento)

## Estrutura de Preços

### Máquina (TimerPage)
- R$ 1,00 por minuto (pode ser ajustado em `/api/machine/activate`)

## APIs Criadas

### GET `/api/machine/get-balance?userId={userId}`
Retorna o saldo atual do usuário
```json
{
  "userId": "uuid",
  "balance": 100,
  "formatted": "R$ 100,00"
}
```

### POST `/api/machine/activate`
Ativa máquina e decrementa saldo
```json
{
  "userId": "uuid",
  "machineId": 1,
  "durationMinutes": 5
}
```

Respostas:
- 200: OK - Máquina ativada
- 402: Saldo insuficiente
- 400/500: Erro

### POST `/api/machine/deactivate`
Desativa máquina
```json
{
  "machineId": 1
}
```

## Funções do Banco de Dados

### Novas Funções em `src/lib/database.ts`

- `setMachineCommand(machineId, command)` - Altera comando da máquina
- `getMachineCommand(machineId)` - Obtém comando atual
- `decrementUserBalance(userId, amount)` - Decrementa saldo
- `ensureProfileExists(userId)` - Garante que perfil existe

### Funções Existentes Melhoradas

- `incrementUserBalance(userId, amount)` - Já incrementa saldo no webhook
- `getUserBalance(userId)` - Retorna saldo atual

## Fluxo Completo do Usuário

1. **Login**: Usuário faz login com Google → dados salvos automaticamente
2. **Pagamento**: Usuário adiciona crédito → webhook incrementa saldo
3. **Ver Saldo**: Saldo aparece na interface em tempo real
4. **Usar Máquina**: 
   - Seleciona tempo (ex: 5 min)
   - Sistema verifica se tem saldo
   - Clica em "INICIAR"
   - API ativa máquina e decrementa saldo
   - Timer faz countdown
   - Ao acabar, máquina é desativada

## Testes Recomendados

1. Testar login com Google
2. Testar pagamento e incremento de saldo
3. Testar verificação de saldo insuficiente
4. Testar ativação e desativação de máquina
5. Testar timer com countdown

## Possíveis Ajustes Futuros

- [ ] Configurar preço da máquina em lugar centralizadoz
- [ ] Adicionar múltiplas máquinas com ID dinâmico
- [ ] Notificações em tempo real do status da máquina
- [ ] Dashboard de admin para gerenciar máquinas
- [ ] Histórico de uso do usuário
- [ ] Limite de tempo por dia/semana

## Notas Importantes

- O saldo é armazenado em **inteiros** (reais, não centavos)
- Todas as APIs têm logs de erro para debug
- O sistema é resiliente a falhas (sempre retorna 200 OK no webhook)
- Admins têm acesso a ambas as rotas (admin + cliente)
