# 🏷️ Sistema de Slugs para Máquinas

## O que é um Slug?

Um **slug** é uma versão URL-friendly (segura para URLs) do nome da máquina. É armazenado no banco de dados para fins de legibilidade e SEO, mas as URLs do sistema continuam usando **IDs numéricos** como identificador principal.

**Exemplo:**
- ID da máquina: `22027`
- URL de acesso: `/maquina/22027`
- Slug armazenado: `salao-principal-shopping-center` (apenas para referência/legibilidade)

## Como Funciona

### 1️⃣ Geração Automática de Slug

Quando você adiciona uma máquina via `AddMachineForm`, o slug é gerado automaticamente:

**Exemplo:**
- ID da máquina: `22027`
- Localização: `Salão Principal Shopping Center`
- Slug gerado: `salao-principal-shopping-center`

O slug é gerado seguindo estas regras:
- Converte para lowercase
- Remove espaços e caracteres especiais
- Substitui espaços por hífens
- NÃO inclui o ID (mantém apenas a localização)

### 2️⃣ Armazenamento no Banco de Dados

O slug é armazenado no campo `slug_id` da tabela `machines` (apenas para referência):

```sql
ALTER TABLE public.machines
ADD COLUMN slug_id VARCHAR(255);
```

**Características:**
- ✅ Campo optional (pode ser nulo)
- ✅ Apenas para legibilidade/SEO
- ✅ IDs numéricos são o identificador principal

---

## Estrutura de URLs

### Acessar máquina por ID:
```
/maquina/22027
```

### Listar todas as máquinas:
```
/maquinas
```

---

## Funções Disponíveis

### `generateSlug(location: string, machineId?: number): string`
Gera um slug a partir da localização (sem incluir o ID).

```typescript
import { generateSlug } from '@/lib/database';

const slug = generateSlug('Salão Principal');
// Retorna: "salao-principal"
```

### `getMachineById(machineId: number)`
Busca uma máquina pelo ID no banco de dados.

```typescript
import { getMachineById } from '@/lib/database';

const { data: machine, error } = await getMachineById(22027);
if (machine) {
  console.log(`Máquina encontrada: ${machine.location}`);
}
```

### `updateMachineSlug(machineId: number, slugId: string)`
Atualiza o slug_id de uma máquina existente.

```typescript
import { updateMachineSlug } from '@/lib/database';

const { data, error } = await updateMachineSlug(22027, 'nova-localizacao');
```

---

## Páginas Criadas

### 1. `/maquinas` - Lista de Máquinas
Exibe todas as máquinas disponíveis com:
- ID da máquina
- Slug (para referência)
- Localização
- Status (Online/Offline)
- Comando (Ligada/Desligada)
- Link para acessar a máquina via ID

### 2. `/maquina/[id]` - Detalhes da Máquina
Mostra os detalhes completos de uma máquina específica:
- ID (identificador na URL)
- Slug (para referência)
- Localização
- Status
- Comando
- Data de criação/atualização

---

## Exemplos de Uso

### Adicionar Nova Máquina
```typescript
// No componente AddMachineForm
const slug = generateSlug('Shopping Center Zona Norte');
// Retorna: "shopping-center-zona-norte"

// Criar máquina
await supabase.from('machines').insert({
  id: 22027,
  location: 'Shopping Center Zona Norte',
  slug_id: slug,
  status: 'offline',
  command: 'off'
});
```

### Buscar Máquina por ID
```typescript
// Em uma página ou componente
const { data: machine } = await getMachineById(22027);

if (machine) {
  console.log(`Máquina ${machine.id}: ${machine.location}`);
  console.log(`Slug: ${machine.slug_id}`);
}
```

### Navegar para Máquina
```typescript
// Link direto usando ID
<Link href={`/maquina/${machine.id}`}>
  Ver Máquina
</Link>

// Redirect programático
router.push(`/maquina/22027`);
```

---

## Estrutura de URLs Finais

| Ação | URL | Parâmetro |
|------|-----|-----------|
| Listar máquinas | `/maquinas` | Nenhum |
| Ver máquina | `/maquina/22027` | ID numérico |
| Ver máquina | `/maquina/1` | ID numérico |

---

## Benefícios do Sistema

✅ **URLs simples**: IDs numéricos são diretos e fáceis de usar  
✅ **Slug para referência**: Legibilidade no banco de dados  
✅ **Identificador único**: Cada máquina tem um ID único  
✅ **Performance**: Índice SQL em ID para buscas rápidas  
✅ **Escalabilidade**: Suporta múltiplas máquinas sem conflitos  

---

## Como o Slug é Usado

O `slug_id` é armazenado apenas para **referência e legibilidade** no banco de dados. Nas URLs e rotas, o sistema continua usando **IDs numéricos simples**.

**Exemplo no banco de dados:**
```json
{
  "id": 22027,
  "location": "Shopping Center Zona Norte",
  "slug_id": "shopping-center-zona-norte",
  "status": "offline",
  "command": "off"
}
```

**URL para acessar:**
```
/maquina/22027
```

---

## Fluxo Completo

```
1. Usuário abre /maquinas
   ↓
2. Página carrega lista de máquinas via getAllMachines()
   ↓
3. Usuário clica em uma máquina
   ↓
4. Navega para /maquina/[ID_NUMÉRICO]
   ↓
5. Página busca máquina via getMachineById(ID)
   ↓
6. API retorna dados da máquina
   ↓
7. Página exibe detalhes da máquina + slug (para referência)
   ↓
8. Usuário pode ativar, ver histórico, etc.
```

---

## Próximas Melhorias (Opcional)

- [ ] Implementar busca de máquinas por slug_id em dashboard
- [ ] Adicionar filtros por slug na listagem
- [ ] Criar relatórios com slugs
- [ ] Exportar máquinas com slugs

---

## Suporte

Caso tenha dúvidas sobre o sistema:
1. Verifique se a migration 006 foi executada no Supabase
2. Certifique-se que o campo `slug_id` existe na tabela `machines`
3. Teste a rota em `/maquina/1` ou `/maquina/22027`

✅ **Sistema de IDs + Slugs Implementado e Funcional!** 🚀
