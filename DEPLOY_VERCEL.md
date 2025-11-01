# 🚀 Guia Completo de Deploy na Vercel

Este guia detalhado vai te ajudar a fazer o deploy completo do seu projeto na Vercel.

## 📋 Pré-requisitos

1. Conta no GitHub (ou GitLab/Bitbucket)
2. Conta na Vercel (gratuita)
3. Conta no Supabase (já configurada)
4. Conta no Mercado Pago (para pagamentos)

---

## 🔧 Passo 1: Preparar o Repositório

### 1.1. Criar arquivo `.gitignore` (se não existir)

Certifique-se de que seu `.gitignore` inclui:

```
.env.local
.env*.local
node_modules/
.next/
.vercel
```

### 1.2. Fazer commit e push do código

```bash
git add .
git commit -m "Preparando para deploy"
git push origin main
```

---

## 🌐 Passo 2: Configurar Variáveis de Ambiente na Vercel

### 2.1. Criar Projeto na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "Add New Project"
4. Selecione seu repositório
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./projeto-arnaldo-upcaraspiradores` (se necessário)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (padrão)

### 2.2. Adicionar Variáveis de Ambiente

Antes de fazer o deploy, clique em **"Environment Variables"** e adicione:

#### Variáveis do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

#### Variáveis do Mercado Pago:
```
MERCADOPAGO_ACCESS_TOKEN=seu-access-token-do-mercado-pago
```

#### Variável da URL do App (para webhooks):
```
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
```

> **⚠️ IMPORTANTE**: Após o primeiro deploy, você precisará atualizar `NEXT_PUBLIC_APP_URL` com a URL real da Vercel.

---

## 🔑 Passo 3: Obter Credenciais do Mercado Pago

### 3.1. Acessar Painel do Mercado Pago

1. Acesse [mercadopago.com.br](https://www.mercadopago.com.br)
2. Faça login na sua conta
3. Vá em **"Seu negócio"** > **"Configurações"** > **"Credenciais"**

### 3.2. Obter Access Token

- **Produção**: Use as credenciais de **Produção**
- **Testes**: Use as credenciais de **Teste** (recomendado para começar)

Copie o **Access Token** e adicione como variável de ambiente na Vercel.

### 3.3. Configurar Webhook (Opcional mas Recomendado)

1. No painel do Mercado Pago, vá em **"Webhooks"**
2. Adicione a URL: `https://seu-projeto.vercel.app/api/payment/webhook`
3. Selecione os eventos que deseja receber:
   - `payment`
   - `payment.updated`

---

## 📦 Passo 4: Fazer o Deploy

### 4.1. Deploy Inicial

1. Na Vercel, clique em **"Deploy"**
2. Aguarde o processo (geralmente 2-5 minutos)
3. Acompanhe os logs em tempo real

### 4.2. Verificar Build

Se houver erros:
- Verifique os logs na Vercel
- Confirme que todas as variáveis de ambiente estão configuradas
- Verifique se `package.json` está correto

---

## 🔍 Passo 5: Atualizar Configurações Pós-Deploy

### 5.1. Atualizar URL do App

Após o primeiro deploy bem-sucedido:

1. Copie a URL do projeto (ex: `https://seu-projeto.vercel.app`)
2. Na Vercel, vá em **Settings** > **Environment Variables**
3. Atualize `NEXT_PUBLIC_APP_URL` com a URL real
4. Faça um novo deploy (ou aguarde o redeploy automático)

### 5.2. Configurar Domínio Personalizado (Opcional)

1. Na Vercel, vá em **Settings** > **Domains**
2. Adicione seu domínio
3. Configure os DNS conforme instruções

---

## ✅ Passo 6: Testar a Aplicação

### 6.1. Testar Funcionalidades Básicas

- [ ] Login/Logout funciona
- [ ] Painel de controle acessível para admin
- [ ] Redirecionamento para `/home` para clientes

### 6.2. Testar Integração de Pagamentos

#### Teste PIX:
1. Vá em **Adicionar Crédito** > **PIX**
2. Selecione um valor
3. Informe CPF de teste
4. Verifique se o código PIX é gerado

#### Teste Cartão de Crédito:
1. Vá em **Adicionar Crédito** > **Cartão de Crédito**
2. Use cartão de teste do Mercado Pago:
   - **Número**: `5031 4332 1540 6351`
   - **CVV**: `123`
   - **Validade**: Qualquer data futura
   - **Nome**: Qualquer nome
   - **CPF**: Qualquer CPF válido
3. Verifique se o pagamento é processado

### 6.3. Verificar Logs

Na Vercel, vá em **Settings** > **Logs** para verificar erros em produção.

---

## 🛠️ Passo 7: Troubleshooting

### Erro: "Variáveis de ambiente não configuradas"

**Solução**: Verifique se todas as variáveis foram adicionadas na Vercel e faça um novo deploy.

### Erro: "MERCADOPAGO_ACCESS_TOKEN não configurado"

**Solução**: 
1. Verifique se o token está correto
2. Confirme que está usando credenciais de Produção (não Teste)

### Erro: "Supabase client creation failed"

**Solução**:
1. Verifique `NEXT_PUBLIC_SUPABASE_URL`
2. Verifique `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Confirme que as URLs estão sem espaços extras

### Webhook não está recebendo notificações

**Solução**:
1. Verifique a URL do webhook no Mercado Pago
2. Confirme que `NEXT_PUBLIC_APP_URL` está configurada corretamente
3. Teste o endpoint manualmente: `https://seu-projeto.vercel.app/api/payment/webhook`

### Build falha

**Solução**:
1. Teste localmente: `npm run build`
2. Verifique se todas as dependências estão em `package.json`
3. Confira os logs de erro na Vercel

---

## 📝 Checklist Final

Antes de considerar o deploy completo, confirme:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Build passando sem erros
- [ ] Login funcionando
- [ ] Painel de controle acessível
- [ ] Pagamento PIX funcionando (teste)
- [ ] Pagamento cartão funcionando (teste)
- [ ] Webhook configurado (opcional)
- [ ] Domínio personalizado configurado (opcional)

---

## 🔄 Deploy Contínuo

A Vercel faz deploy automático sempre que você fizer push para a branch `main` (ou a branch padrão configurada).

### Processo:

1. Faça alterações no código
2. Commit: `git commit -m "Sua mensagem"`
3. Push: `git push origin main`
4. A Vercel detecta automaticamente e faz o deploy

---

## 📚 Recursos Adicionais

- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [Documentação Supabase](https://supabase.com/docs)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs na Vercel
2. Consulte a documentação das ferramentas
3. Teste localmente primeiro
4. Verifique se todas as variáveis estão configuradas

---

**🎉 Parabéns! Seu projeto está no ar!**

