# 🏷️ Sistema de Slugs - Arquitetura com QR Code

## 🎯 Conceito Principal

O **site inteiro** é atrelado a uma **máquina específica via slug**. Quando um usuário escaneia um QR code em uma máquina, o URL inclui o slug_id e o usuário entra automaticamente naquele contexto de máquina.

### Exemplo de Fluxo:

```
1. Máquina "Salão Principal" tem slug: "salao-principal"
   ↓
2. QR code na máquina aponta para: https://upcaraspiradores.com/salao-principal
   ↓
3. Usuário escaneia QR code
   ↓
4. Site carrega com a máquina "salao-principal" como contexto global
   ↓
5. Todas as operações (ativar, histórico, crédito) usam essa máquina
```

---

## 📁 Estrutura de Arquitetura

### 1. **Rota Raiz `/` (Home)**
- **Arquivo:** `src/app/page.tsx`
- **Função:** Página inicial onde usuário pode:
  - Escanear QR code (que já redireciona ao slug correto)
  - Digitar manualmente o slug de uma máquina
  - Ver exemplos de URLs

### 2. **Rota Dinâmica `/[slug]` (Máquina Específica)**
- **Layout:** `src/app/[slug]/layout.tsx`
  - Captura o slug da URL
  - Carrega a máquina do banco de dados
  - Fornece `MachineContext` para toda a subárvore

- **Página:** `src/app/[slug]/page.tsx`
  - Exibe informações da máquina
  - Mostra status, localização, comandos
  - Oferece ações: Ativar, Ver Histórico, Comprar Crédito, Suporte

### 3. **MachineContext - Estado Global**
- **Arquivo:** `src/contexts/MachineContext.tsx`
- **Responsabilidade:**
  - Armazena a máquina selecionada em contexto global
  - Disponibiliza hook `useMachine()` para qualquer componente
  - Carrega máquina automaticamente ao montar layout

---

## 🔄 Fluxo de Funcionamento

### Quando usuário acessa `/salao-principal`:

```
1. URL: /salao-principal
   ↓
2. Next.js match rota dinâmica [slug]
   ↓
3. Layout [slug]/layout.tsx:
   - Captura params.slug = "salao-principal"
   - Chama getMachineBySlug("salao-principal")
   - Busca máquina no banco de dados
   - Renderiza MachineProvider com máquina
   ↓
4. MachineContext:
   - Armazena máquina em estado global
   - Hook useMachine() fica disponível
   ↓
5. Página [slug]/page.tsx:
   - Acessa useMachine() para pegar máquina
   - Exibe informações e ações
```

---

## 💻 Como Usar em Componentes

### Acessar dados da máquina em qualquer componente:

```tsx
'use client';

import { useMachine } from '@/contexts/MachineContext';

export default function MyComponent() {
  const { machine, loading, error } = useMachine();

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h1>{machine.location}</h1>
      <p>ID: {machine.id}</p>
      <p>Status: {machine.status}</p>
    </div>
  );
}
```

### Ativar máquina de um botão:

```tsx
'use client';

import { useMachine } from '@/contexts/MachineContext';

export default function ActivateButton() {
  const { machine } = useMachine();

  const handleActivate = async () => {
    // Enviar comando para máquina
    const response = await fetch('/api/machine/command', {
      method: 'POST',
      body: JSON.stringify({
        machineId: machine.id,
        command: 'on'
      })
    });
  };

  return (
    <button onClick={handleActivate}>
      Ativar {machine.location}
    </button>
  );
}
```

---

## 📱 URLs Geradas por QR Codes

### Formato:
```
https://upcaraspiradores.com/{slug}
```

### Exemplos:
- `/salao-principal` → Máquina ID 1
- `/entrada-shopping` → Máquina ID 5
- `/lavagem-completa` → Máquina ID 22027

### Como gerar:

1. **No banco de dados**, cada máquina tem campo `slug_id`:
```sql
SELECT id, location, slug_id FROM machines;
-- Retorna:
-- 1, Salão Principal, salao-principal
-- 5, Entrada Shopping, entrada-shopping
-- 22027, Lavagem Completa, lavagem-completa
```

2. **QR code aponta para:**
```
https://upcaraspiradores.com/salao-principal
```

3. **Usuário escaneia** → Entra automaticamente no contexto daquela máquina

---

## 🛣️ Rotas Disponíveis

| URL | Descrição | Contexto |
|-----|-----------|----------|
| `/` | Home (entrada manual ou QR) | Sem máquina |
| `/salao-principal` | Página da máquina | Máquina: salao-principal |
| `/entrada-shopping` | Página da máquina | Máquina: entrada-shopping |
| `/lavagem-completa` | Página da máquina | Máquina: lavagem-completa |

---

## 📊 Banco de Dados

### Tabela `machines`:

```sql
CREATE TABLE public.machines (
  id BIGINT PRIMARY KEY,
  location VARCHAR(255) NOT NULL,
  slug_id VARCHAR(255) UNIQUE,
  status VARCHAR(50),
  command VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_machines_slug_id ON public.machines(slug_id);
```

### Exemplo de dados:
```json
{
  "id": 1,
  "location": "Salão Principal",
  "slug_id": "salao-principal",
  "status": "online",
  "command": "off",
  "created_at": "2025-11-16T10:00:00Z"
}
```

---

## 🔌 API Endpoints

### GET `/api/machine/by-slug`

**Busca uma máquina pelo slug_id:**

```bash
GET /api/machine/by-slug?slug=salao-principal
```

**Resposta (Sucesso):**
```json
{
  "success": true,
  "machine": {
    "id": 1,
    "location": "Salão Principal",
    "slug_id": "salao-principal",
    "status": "online",
    "command": "off"
  }
}
```

**Resposta (Erro):**
```json
{
  "error": "Máquina não encontrada",
  "slug": "inexistente"
}
```

---

## 📋 Funções Database

### `getMachineBySlug(slugId: string)`
Busca máquina pelo slug_id.

```typescript
const { data, error } = await getMachineBySlug('salao-principal');
```

### `generateSlug(location: string, machineId?: number)`
Gera slug a partir da localização.

```typescript
const slug = generateSlug('Salão Principal');
// Retorna: "salao-principal"
```

### `updateMachineSlug(machineId: number, slugId: string)`
Atualiza slug de uma máquina.

```typescript
await updateMachineSlug(1, 'novo-slug');
```

---

## 🎯 Fluxo de QR Code Completo

```
QR Code na Máquina
  ↓
URL: upcaraspiradores.com/salao-principal
  ↓
Usuário escaneia
  ↓
Browser abre URL
  ↓
Next.js match [slug]/layout.tsx
  ↓
getMachineBySlug('salao-principal')
  ↓
Busca no Supabase
  ↓
MachineProvider wraps página
  ↓
[slug]/page.tsx renderiza
  ↓
useMachine() hook disponível
  ↓
Interface carregada com máquina
  ↓
Usuário interage: Ativa/Histórico/Compra
```

---

## ✨ Benefícios

✅ **Experiência Fluida**: QR code → Site já carregado com máquina  
✅ **Contexto Global**: Qualquer componente sabe qual é a máquina  
✅ **URLs Amigáveis**: `/salao-principal` ao invés de IDs numéricos  
✅ **Escalável**: Suporta ilimitadas máquinas com slugs únicos  
✅ **Seguro**: Slug é validado no backend contra banco de dados  
✅ **Rápido**: Context carrega máquina só uma vez, reutiliza em toda subtree

---

## 🧪 Como Testar

### 1. Criar uma máquina no Supabase:
```sql
INSERT INTO public.machines (id, location, slug_id, status, command)
VALUES (1, 'Salão Principal', 'salao-principal', 'online', 'off');
```

### 2. Acessar URL:
```
http://localhost:3000/salao-principal
```

### 3. Verificar:
- Página carrega com a máquina
- Mostra "Salão Principal" como título
- Contexto global tem a máquina disponível

### 4. Testar hook em componente:
```tsx
const { machine } = useMachine();
console.log(machine.location); // "Salão Principal"
```

---

## 📝 Próximos Passos

- [ ] Criar sub-rotas: `/[slug]/historico`, `/[slug]/credito`
- [ ] Implementar botão "Ativar Máquina" com API
- [ ] Filtrar histórico por máquina
- [ ] Compra de crédito atrelada à máquina
- [ ] Gerar QR codes dinâmicos no dashboard admin
- [ ] Validar slugs no admin ao criar máquinas

✅ **Sistema de Slugs como Rota Raiz Implementado!** 🚀
