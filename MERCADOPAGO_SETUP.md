# Integração MercadoPago - Guia de Configuração

## ✅ Funcionalidades Implementadas

### 1. **PIX** ✅
- Criação de pagamento PIX
- Geração de QR Code
- Exibição do código PIX para pagamento

### 2. **Cartão de Crédito** ✅
- Tokenização segura do cartão
- Processamento de pagamento
- Validação de dados

### 3. **Mensalista (Assinatura Recorrente)** ✅
- Criação de assinatura mensal
- Cobrança automática no dia 15 de cada mês
- Gerenciamento via Preapproval API

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente

Adicione no arquivo `.env.local`:

```env
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui

# URL da aplicação (para webhooks)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
# OU use automaticamente VERCEL_URL em produção
```

### 2. Obter Access Token do MercadoPago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em **Suas integrações** > **Credenciais**
3. Copie o **Access Token** (produção ou teste)
4. Cole no `.env.local`

### 3. Configurar Webhooks

1. No painel do MercadoPago, vá em **Webhooks**
2. Adicione a URL: `https://seu-dominio.com/api/payment/webhook`
3. Selecione os eventos:
   - `payment`
   - `merchant_order`

## 📡 Endpoints da API

### POST `/api/payment/token`
Cria um token seguro do cartão de crédito.

**Body:**
```json
{
  "cardNumber": "5031433215406351",
  "cardholderName": "APRO",
  "cardExpirationMonth": "11",
  "cardExpirationYear": "2025",
  "securityCode": "123",
  "identificationType": "CPF",
  "identificationNumber": "12345678900"
}
```

**Response:**
```json
{
  "token": "token_id_aqui"
}
```

### POST `/api/payment/create`
Cria um pagamento (PIX ou Cartão).

**Body:**
```json
{
  "amount": "50",
  "paymentMethod": "pix", // ou "credit-card"
  "userId": "user_uuid",
  "payer": {
    "email": "user@example.com",
    "cpf": "12345678900"
  },
  "description": "Adicionar crédito",
  "cardToken": "token_id" // apenas para cartão
}
```

**Response (PIX):**
```json
{
  "success": true,
  "paymentId": 123456789,
  "status": "pending",
  "pixCode": "00020126...",
  "pixQrCode": "data:image/png;base64,...",
  "ticketUrl": "https://..."
}
```

**Response (Cartão):**
```json
{
  "success": true,
  "paymentId": 123456789,
  "status": "approved"
}
```

### POST `/api/payment/subscription`
Cria uma assinatura mensal recorrente.

**Body:**
```json
{
  "amount": "50",
  "userId": "user_uuid",
  "cardToken": "token_id",
  "payer": {
    "email": "user@example.com",
    "cpf": "12345678900"
  },
  "description": "Assinatura mensal"
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "preapproval_id",
  "status": "authorized",
  "init_point": "https://...",
  "sandbox_init_point": "https://..."
}
```

### POST `/api/payment/webhook`
Webhook para receber notificações do MercadoPago.

**Nota:** Este endpoint é chamado automaticamente pelo MercadoPago.

## 🧪 Cartões de Teste

Para testar em ambiente de desenvolvimento:

### Cartão Aprovado:
- Número: `5031433215406351`
- CVV: `123`
- Nome: `APRO`
- Validade: `11/25`
- CPF: `12345678900`

### Cartão Recusado:
- Número: `5031433215406351`
- CVV: `123`
- Nome: `OTHE`
- Validade: `11/25`

Mais cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

## 📊 Status de Pagamento

- `pending`: Aguardando pagamento (PIX)
- `approved`: Pagamento aprovado
- `rejected`: Pagamento recusado
- `cancelled`: Pagamento cancelado
- `refunded`: Pagamento reembolsado

## 🔒 Segurança

1. **Nunca** exponha o Access Token no frontend
2. Use sempre HTTPS em produção
3. Valide os dados do pagador no backend
4. Implemente rate limiting nos endpoints
5. Monitore os webhooks para detectar fraudes

## 📝 Notas Importantes

- **PIX**: O pagamento fica pendente até o usuário escanear o QR Code
- **Cartão**: O pagamento é processado imediatamente
- **Mensalista**: A primeira cobrança acontece no dia 15 do próximo mês
- **Webhooks**: Sempre retornam `{ received: true }` para evitar reenvios

## 🐛 Troubleshooting

### Erro: "MERCADOPAGO_ACCESS_TOKEN não configurado"
- Verifique se a variável está no `.env.local`
- Reinicie o servidor após adicionar

### Erro: "Invalid card token"
- Verifique se o token foi criado corretamente
- Certifique-se de usar cartões de teste válidos

### Webhook não recebe notificações
- Verifique se a URL está configurada no painel do MercadoPago
- Teste manualmente: `GET /api/payment/webhook` deve retornar `{ status: 'ok' }`

## 📚 Documentação Oficial

- SDK Node.js: https://github.com/mercadopago/sdk-nodejs
- API de Pagamentos: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/credentials
- Preapproval (Assinaturas): https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview

