# Configuração do Checkout Pro para Produção

Este documento descreve como garantir que o Checkout Pro está configurado para ambiente de produção.

## 1. Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no seu `.env.local` ou nas variáveis de ambiente da Vercel:

```env
# Token de Produção do Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx

# URL da aplicação em produção
NEXT_PUBLIC_APP_URL=https://projeto-arnaldo-upcaraspiradores.vercel.app
```

## 2. Como Identificar Token de Produção

- **Token de Produção**: Começa com `APP_USR-` e NÃO contém `TEST`
- **Token de Teste**: Começa com `TEST-` ou contém `TEST` no meio

## 3. Verificação Automática

O sistema verifica automaticamente se está usando token de produção:

- Se `NODE_ENV === 'production'` e o token parecer ser de teste, um aviso será logado
- O sistema sempre prioriza `init_point` (produção) sobre `sandbox_init_point` (teste)

## 4. URLs do Checkout

O Mercado Pago retorna duas URLs:

- **`init_point`**: URL de produção (sempre usada quando disponível)
- **`sandbox_init_point`**: URL de teste (usada apenas se `init_point` não estiver disponível)

O código sempre prioriza `init_point` para garantir que está usando produção.

## 5. Como Testar

### Em Desenvolvimento (Local)

1. Use um token de teste do Mercado Pago
2. O sistema funcionará normalmente, mas usará sandbox
3. Verifique os logs para confirmar qual URL está sendo usada

### Em Produção

1. Use um token de produção do Mercado Pago
2. O sistema usará automaticamente `init_point` (produção)
3. Verifique os logs para confirmar que está usando produção

## 6. Verificação Manual

Para verificar se está usando produção, verifique os logs:

```bash
# Em desenvolvimento, você verá:
Checkout URL: https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=...
Is Production: true/false

# Em produção, você verá apenas logs de erro (se houver)
```

## 7. Troubleshooting

### Problema: Checkout abre em modo sandbox em produção

**Solução**: 
1. Verifique se `MERCADOPAGO_ACCESS_TOKEN` está configurado com token de produção
2. Verifique se o token começa com `APP_USR-` e não contém `TEST`
3. Verifique os logs do servidor para ver qual URL está sendo usada

### Problema: Erro ao criar preferência

**Solução**:
1. Verifique se o token está correto
2. Verifique se o token tem permissões para criar preferências
3. Verifique os logs para ver o erro específico

## 8. Fluxo Completo

1. **Usuário clica em "Adicionar Crédito"**
2. **Sistema cria preferência no Mercado Pago** (usando token de produção)
3. **Mercado Pago retorna URLs** (`init_point` e `sandbox_init_point`)
4. **Sistema usa `init_point`** (produção) se disponível
5. **Usuário é redirecionado para checkout do Mercado Pago**
6. **Após pagamento, webhook é chamado**
7. **Sistema incrementa saldo na tabela `profiles`**
8. **Sistema atualiza transação na tabela `transactions`**

## 9. Segurança

- ✅ Token de produção nunca é exposto no frontend
- ✅ Validação de token no backend
- ✅ URLs de checkout são geradas pelo Mercado Pago
- ✅ Webhook valida pagamentos antes de incrementar saldo

