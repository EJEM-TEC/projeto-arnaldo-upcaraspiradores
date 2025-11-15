# 📋 Plano de Tarefas - UpCarAspiradores

## ✅ Concluído

### 1. ✅ Email do Suporte (Arnaldo)
- **Arquivo:** `src/components/mobile/SupportPage.tsx`
- **Alteração:** Adicionado email `arnaldfirst@gmail.com` com link clicável
- **Status:** Pronto para uso

### 2. ✅ Botões de Seleção de Dinheiro (Redondos)
- **Arquivos:** 
  - `src/components/mobile/PixPage.tsx`
  - `src/components/mobile/CreditCardPage.tsx`
  - `src/components/mobile/MonthlyPage.tsx`
- **Status:** Todos já estão com `rounded-full` - **Nenhuma alteração necessária**

### 3. ✅ Logo UpCarAspiradores - Responsiva e Maior
- **Arquivo:** `src/components/DashboardLayout.tsx`
- **Alterações:**
  - Aumentada de 50x50 para 120x120 pixels
  - Adicionado `priority` para otimizar carregamento
  - Adicionado hover effect com `transition-opacity`
  - Centralizada com `justify-center`
- **Status:** Pronto!

---

## ⏳ Aguardando Contexto/Materiais do Usuário

### 4. 📄 Termos e Condições + Política de Privacidade
**Arquivo:** `src/components/mobile/TermsPage.tsx` e `PrivacyPage.tsx`

**Status:** Aguardando material do usuário

**Como usar quando receber:**
- Você fornece o conteúdo em texto ou HTML
- Eu coloco dentro das páginas correspondentes
- As páginas já existem e estão com layout padrão

---

### 5. 🏠 Tela de Advertisement AspiraCar (Boas-vindas ao logar)
**Localização sugerida:** Nova rota `/home` ou modal na dashboard

**O que preciso:**
- Descrição de como deve ser a tela
- Imagens/banner que deseja usar
- Texto/mensagem de boas-vindas
- Tempo que deve aparecer antes de desaparecer (ou se é modal)

**Arquitetura sugerida:**
```
src/components/mobile/WelcomePage.tsx (novo)
ou
src/components/mobile/AdvertisementModal.tsx (novo)
```

---

### 6. 💳 Crédito Mensalista
**Status:** Parcialmente implementado (componente MonthlyPage existe)

**O que falta:**
- [ ] Integração com API de pagamento recorrente (Mercado Pago)
- [ ] Endpoint: `POST /api/payment/subscription`
- [ ] Database: Adicionar tabela `subscriptions` no Supabase
- [ ] Interface para gerenciar assinatura no painel
- [ ] Lógica de cobrança recorrente

**Quando estiver pronto, vou:**
1. Criar tabela `subscriptions` no Supabase
2. Criar API para gerenciar subscriptions
3. Integrar com MonthlyPage

---

### 7. ❌ Cancelamento de Crédito Mensalista
**Depende de:** Tarefa #6

**O que será feito:**
- [ ] Interface para cancelar subscription
- [ ] Confirmar cancelamento com o usuário
- [ ] Endpoint: `DELETE /api/payment/subscription`
- [ ] Parar cobrança recorrente no Mercado Pago

---

### 8. 📊 Histórico de Uso do Cliente
**Arquivo:** `src/components/mobile/HistoryPage.tsx`

**Status:** Página existe mas precisa de dados

**O que falta:**
- [ ] Buscar histórico de ativações do banco
- [ ] Formatar e exibir:
  - Data/hora da ativação
  - Duração em minutos
  - Custo (R$ 1,00 por minuto)
  - Status (concluído/cancelado)
- [ ] Filtros por período (hoje, semana, mês)

**Vou precisar de:**
- Confirmação de como quer que apareça os dados

---

### 9. 🔐 Recuperação de Senha
**Status:** Não iniciado

**O que precisa ser feito:**
- [ ] Página: `/esqueci_senha`
- [ ] Integração com email/Supabase
- [ ] Link de reset enviado por email
- [ ] Página para redefinir senha

**Nota:** Você mencionou que fará hoje - deixarei pronto quando precisar integrar!

---

### 10. 🧪 Testes da Dashboard do Arnaldo
**Status:** A fazer quando as features estiverem prontas

**Checklist de testes:**
- [ ] Adicionar crédito (via PIX/Cartão)
- [ ] Faturamento + REPASSE (PDF com tabela formatada)
- [ ] Histórico de acionamentos
- [ ] Adicionar máquina
- [ ] Alterar senha (já funciona)
- [ ] Logo responsiva (✅ FEITO)

**Você deve verificar se:**
- Tudo aparenta estar funcional visualmente
- Não há erros no console
- A UI está responsiva

---

## 🚀 Próximas Ações

### Curto Prazo (Imediato)
1. ✅ Email suporte - **FEITO**
2. ✅ Logo responsiva - **FEITO**
3. ⏳ Enviar material de Termos/Privacidade
4. ⏳ Descrever tela de Advertisement

### Médio Prazo
1. Implementar Crédito Mensalista
2. Implementar Cancelamento
3. Melhorar Histórico de Uso

### Longo Prazo
1. Integrar Recuperação de Senha
2. Testes completos da dashboard

---

## 📝 Notas Importantes

- **Realtime Balance:** Já funciona perfeitamente com o novo hook `useBalance`
- **Signup:** Novos usuários já começam com saldo = 0 automaticamente
- **Dashboard:** Logo está muito melhor agora, responsiva e maior
- **Suporte:** Email do Arnaldo está acessível para clientes

---

## 💬 Próximo Passo

Envie:
1. Conteúdo de Termos e Condições
2. Conteúdo de Política de Privacidade
3. Descrição/imagens para a tela de Advertisement

Que seguimos com as implementações! 🚀
