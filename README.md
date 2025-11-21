# Sistema de Aspiradores Inteligentes UPCAR

Sistema completo de gerenciamento de aspiradores com pagamento integrado via Mercado Pago e controle IoT.

## 🚀 Funcionalidades Principais

- ✅ **Sistema de Pagamento**: Integração completa com Mercado Pago (PIX, Cartão, Assinatura)
- ✅ **Webhook Automático**: Atualização automática de saldo após pagamento aprovado
- ✅ **Controle de Máquinas**: Sistema de timer com ativação/desativação automática
- ✅ **Preço por Minuto**: R$ 1,00 por minuto de uso
- ✅ **Verificação de Saldo**: Validação antes de ativar máquina
- ✅ **Histórico Completo**: Transações e uso de máquinas
- ✅ **Monitor Python**: Script para simular hardware embarcado
- ✅ **APIs REST**: Completas para integração

## 📚 Documentação

### Guias de Configuração
- 📄 [**WEBHOOK_PAGAMENTO_SETUP.md**](WEBHOOK_PAGAMENTO_SETUP.md) - Configuração do webhook e sistema de pagamento
- 📄 [**RESUMO_IMPLEMENTACAO.md**](RESUMO_IMPLEMENTACAO.md) - Visão geral de tudo que foi implementado
- 📄 [**teste_sistema.md**](teste_sistema.md) - Passo a passo para testar o sistema

### Hardware e IoT
- 📄 [**INTEGRACAO_HARDWARE.md**](INTEGRACAO_HARDWARE.md) - Como integrar com ESP32, Raspberry Pi, Arduino
- 📄 [**INSTALACAO_MONITOR.md**](INSTALACAO_MONITOR.md) - Script Python de monitoramento
- 🐍 [**monitor_machines.py**](monitor_machines.py) - Monitor de comandos das máquinas

### Outros
- 📄 [**CHECKOUT_PRO_PRODUCTION.md**](CHECKOUT_PRO_PRODUCTION.md) - Checkout Pro do Mercado Pago
- 📄 [**EXCEL_IMPORT_DOCS.md**](EXCEL_IMPORT_DOCS.md) - Importação de dados via Excel

## 🎯 Como Funciona

### 1. Fluxo de Pagamento
```
Usuário → Adiciona Crédito → Mercado Pago → Pagamento Aprovado
    ↓
Webhook recebe notificação → Atualiza saldo automaticamente
```

### 2. Fluxo de Uso da Máquina
```
Usuário acessa /home/[slug-maquina]
    ↓
Seleciona tempo (ex: 10 min = R$ 10,00)
    ↓
Sistema verifica saldo ≥ valor?
    ↓
✅ SIM:
   - Debita R$ 10,00 do saldo
   - Seta comando da máquina: 'on'
   - Inicia timer de 10 minutos
   - Timer decrementa a cada 1 minuto
   - Quando chega a zero:
     * Seta comando: 'off'
     * Atualiza histórico

❌ NÃO:
   - Exibe: "Saldo insuficiente"
   - Não permite iniciar
```

### 3. Controle do Hardware
```
Hardware (ESP32/Raspberry Pi)
    ↓
Monitora tabela 'machines' no Supabase
    ↓
Detecta comando = 'on' → Liga aspirador fisicamente
    ↓
Detecta comando = 'off' → Desliga aspirador
```

## 🛠️ Início Rápido

### Pré-requisitos
- Node.js 18+
- Conta no Supabase
- Conta no Mercado Pago (para pagamentos)

### Instalação

```bash
# Clone o repositório
git clone [url-do-repositorio]
cd projeto-arnaldo-upcaraspiradores

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais
```

### Variáveis de Ambiente

Crie um arquivo `.env.local` com:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=sua_public_key
```

### Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

**profiles** - Saldo dos usuários
```sql
id (UUID) | saldo (INTEGER) | updated_at (TIMESTAMP)
```

**machines** - Máquinas cadastradas
```sql
id (INTEGER) | slug_id (TEXT) | location (TEXT) | command (TEXT) | status (TEXT)
```

**activation_history** - Histórico de uso
```sql
id | machine_id | user_id | started_at | ended_at | duration_minutes | cost | status
```

**transactions** - Histórico de pagamentos
```sql
id | user_id | amount | type | description | payment_method | created_at
```

Ver detalhes completos em [WEBHOOK_PAGAMENTO_SETUP.md](WEBHOOK_PAGAMENTO_SETUP.md)

## 🔌 APIs Disponíveis

### Pagamentos
- `POST /api/payment/webhook` - Recebe notificações do Mercado Pago
- `POST /api/payment/create` - Cria novo pagamento
- `GET /api/payment/status` - Consulta status de pagamento

### Máquinas
- `GET /api/machine/get-balance?userId=xxx` - Obtém saldo do usuário
- `POST /api/machine/activate` - Ativa máquina e inicia timer
- `POST /api/machine/deactivate` - Desativa máquina
- `GET /api/machine/by-slug?slug=xxx` - Busca máquina por slug

Ver documentação completa das APIs em [WEBHOOK_PAGAMENTO_SETUP.md](WEBHOOK_PAGAMENTO_SETUP.md)

## 🧪 Como Testar

### 1. Teste Rápido
```bash
# Terminal 1: Servidor Next.js
npm run dev

# Terminal 2: Monitor de máquinas (Python)
pip install -r requirements_monitor.txt
python monitor_machines.py
```

### 2. Teste Completo
Siga o guia passo a passo em [teste_sistema.md](teste_sistema.md)

### 3. Teste de Webhook
1. Use ngrok para expor localhost: `ngrok http 3000`
2. Configure a URL no Mercado Pago
3. Faça um pagamento de teste
4. Verifique logs do webhook

## 🔐 Segurança

- ✅ **Row Level Security (RLS)** habilitado em todas as tabelas
- ✅ **Validação de saldo** antes de operações
- ✅ **Service Role** apenas no servidor
- ✅ **Webhook** sempre retorna 200 para evitar spam
- ✅ **HTTPS** obrigatório em produção

## 📱 Páginas Principais

- `/` - Página inicial
- `/login-usuario` - Login de usuários
- `/signup-usuario` - Cadastro de usuários
- `/home/[slug]` - Página da máquina (com timer)
- `/painel_de_controle` - Dashboard admin

## 🤖 Integração com Hardware

O sistema foi projetado para funcionar com hardware embarcado (ESP32, Raspberry Pi, etc.).

### Quick Start Hardware
```cpp
// ESP32 - Código básico
#include <WiFi.h>
#include <HTTPClient.h>

void loop() {
  // Busca comando da máquina
  String command = getCommandFromAPI();
  
  // Liga/desliga relé
  digitalWrite(RELAY_PIN, command == "on" ? HIGH : LOW);
}
```

Ver guia completo em [INTEGRACAO_HARDWARE.md](INTEGRACAO_HARDWARE.md)

## 🐛 Troubleshooting

### Webhook não recebe notificações
- Verifique URL configurada no Mercado Pago
- Use ngrok para desenvolvimento local
- Verifique logs: `console.log` no webhook

### Saldo não atualiza
- Confirme que profile do usuário existe
- Verifique tipo do campo saldo (INTEGER)
- Veja logs do servidor

### Máquina não ativa
- Verifique se slug está correto
- Confirme saldo suficiente
- Teste API manualmente

Ver mais em [teste_sistema.md](teste_sistema.md) - seção "Problemas Comuns"

## 📦 Deploy

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente no dashboard
```

### Outras Plataformas
- Netlify
- Railway
- AWS
- Digital Ocean

Lembre-se de:
1. Configurar variáveis de ambiente
2. Atualizar URL do webhook no Mercado Pago
3. Configurar domínio customizado (opcional)

## 📝 Licença

Este projeto foi desenvolvido para a UPCAR.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📞 Suporte

- 📧 Email: [seu-email]
- 📱 WhatsApp: [seu-whatsapp]
- 📚 Documentação: Ver arquivos .md na raiz do projeto

## 🎉 Próximos Passos

Depois de instalar, siga esta ordem:

1. ✅ Configurar variáveis de ambiente
2. ✅ Executar migrações do Supabase
3. ✅ Testar localmente (ver teste_sistema.md)
4. ✅ Configurar webhook no Mercado Pago
5. ✅ Testar pagamento
6. ✅ Testar ativação de máquina
7. ✅ Deploy em produção
8. ✅ Integrar hardware (se aplicável)

---

**Desenvolvido para UPCAR - Aspiradores Inteligentes** 🚀
