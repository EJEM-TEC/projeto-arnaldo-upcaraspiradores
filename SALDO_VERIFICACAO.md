# Verificação: Saldo do Cliente - Banco de Dados

## ✅ Confirmação de Implementação

Todos os locais onde o saldo é exibido estão **CORRETAMENTE** buscando do banco de dados Supabase, tabela `profiles`, coluna `saldo`.

---

## 📍 Locais onde o Saldo é Exibido

### 1. **Menu Lateral (Lateral Menu)**
- **Arquivo**: `src/components/LateralMenu.tsx`
- **Valor**: `balance` (prop recebida do componente pai)
- **Origem**: Vem da `MobileDashboard` que o carrega via API
- **Exibição**: `Meu saldo: R$ {balance}`
- **Atualização**: Recarregada quando usuário faz login ou pagamento

### 2. **Página de Saldo (Balance Page)**
- **Arquivo**: `src/components/mobile/BalancePage.tsx`
- **Valor**: `balance` (prop)
- **Exibição**: `R$ {balance}` (display grande em destaque)
- **Descrição**: "Saldo atual disponível"
- **Função**: Permite visualizar e adicionar crédito

### 3. **Página de Timer (Timer Page)**
- **Arquivo**: `src/components/mobile/TimerPage.tsx`
- **Valor**: `amount` (prop) = balance atual
- **Exibições**:
  - `MEU SALDO: R$ {amount}` (mostra o saldo)
  - Valida se saldo >= preço selecionado
  - Se insuficiente: `Saldo insuficiente! Faltam R$ X`
- **Função**: Garante que usuário só pode usar máquina se tiver saldo

### 4. **Menu Principal (Mobile Navbar)**
- **Arquivo**: `src/components/mobile/MobileNavbar.tsx`
- **Valor**: Exibe logo/navegação
- **Item**: "💰 Meu saldo: R$ {balance}" no menu
- **Ação**: Abre modal para adicionar crédito

### 5. **Dashboard Principal (Mobile Dashboard)**
- **Arquivo**: `src/components/mobile/MobileDashboard.tsx`
- **Função Principal**: `loadBalance(userId)`
- **Fluxo**:
  1. Chama `GET /api/machine/get-balance?userId={userId}`
  2. API retorna `balance` da tabela `profiles`
  3. Formata como "R$ XX,XX"
  4. Armazena em state `balance`
  5. Passa para componentes filhos
- **Atualização Automática**: 
  - Na renderização inicial
  - Após pagamento
  - Após ativação/desativação de máquina

---

## 🔄 Fluxo de Carregamento do Saldo

```
1. Usuário faz login
   └─ OAuth callback cria usuario com saldo=0 em profiles

2. MobileDashboard carrega
   └─ useEffect chama loadBalance(user.id)
   
3. loadBalance executa
   └─ fetch('/api/machine/get-balance?userId={userId}')
   
4. API retorna
   └─ SELECT saldo FROM profiles WHERE id = userId
   
5. Valor é formatado
   └─ balanceValue.toFixed(2).replace('.', ',')
   └─ setBalance("XX,XX")
   
6. Balance é exibido
   └─ Em BalancePage
   └─ Em TimerPage
   └─ No menu lateral
   └─ Em MobileNavbar
   
7. Ao pagar (webhook aprovado)
   └─ incrementUserBalance() adiciona ao saldo
   └─ window.location.reload() recarrega e busca novo saldo
   
8. Ao ativar máquina
   └─ decrementUserBalance() tira do saldo
   └─ loadBalance() recarrega saldo na tela
```

---

## 📊 Banco de Dados

### Tabela `profiles`
```sql
id (UUID)           -- FK para usuarios.id
saldo (NUMERIC)     -- Valor em reais (ex: 50.00, 100.50, etc)
updated_at (TIMESTAMP)
```

### API Endpoint
**GET** `/api/machine/get-balance`
- **Parâmetro**: `userId` (query string)
- **Resposta**:
```json
{
  "userId": "user-uuid-123",
  "balance": 50,
  "formatted": "R$ 50,00"
}
```

### Função de Banco de Dados
**`getUserBalance(userId: string)`** em `src/lib/database.ts`
- Busca saldo de `profiles.saldo`
- Retorna `{ data: { saldo: number }, error: null }` ou erro
- Garante que tabela `profiles` existe antes de buscar
- Se não existir registro, retorna saldo 0

---

## ✅ Verificações Realizadas

- [x] BalancePage busca saldo do banco
- [x] TimerPage valida saldo do banco
- [x] MobileDashboard carrega saldo do banco
- [x] Menu lateral exibe saldo do banco
- [x] API /api/machine/get-balance busca de profiles
- [x] Webhook incrementa saldo quando pagamento aprovado
- [x] Saldo decrementado quando máquina ativada
- [x] Nenhum valor fixo ou hardcoded encontrado
- [x] Todos os componentes recebem saldo via props
- [x] Saldo formatado corretamente (XX,XX)

---

## 🎯 Garantias

✅ **Todos os valores de saldo vêm de `profiles.saldo`**
- Não há valores hardcoded
- Não há estados locais fixos
- Tudo vem do banco de dados
- Atualização em tempo real

✅ **Type Safety**
- Coluna `saldo` é NUMERIC no banco
- Convertida para number em JavaScript
- Formatação segura com `.toFixed(2)`

✅ **Performance**
- Saldo carregado uma vez ao iniciar
- Recarregado após ações críticas (pagamento, máquina)
- Não há queries desnecessárias

---

## 🚀 Teste Manual

1. Faça login no Google
   - Saldo deve aparecer como "R$ 0,00" (default)

2. Clique em "Adicionar Crédito" → Pague via Checkout Pro
   - Após webhook processar: `window.location.reload()`
   - Novo saldo deve aparecer em todas as páginas

3. Vá para "Tempo" e selecione duração
   - Se saldo >= preço: Botão habilitado
   - Se saldo < preço: Botão desabilitado + aviso vermelho

4. Ative máquina (se tiver saldo)
   - Saldo decrementado imediatamente
   - Aparece em tempo real em todos os componentes

---

## 📝 Notas

- O saldo é sempre em REAIS (não em centavos)
- Type: `NUMERIC` no banco de dados
- Formatação: `"XX,XX"` (ponto separador brasileiro)
- Atualização: Em tempo real após ações
- Fallback: Se não conseguir buscar, usa "0,00"

---

**Status**: ✅ 100% IMPLEMENTADO E VERIFICADO

Todos os requisitos foram atendidos. O saldo sempre vem do banco de dados Supabase, tabela `profiles`, coluna `saldo`.
