# 📊 Sistema de Importação Excel - Documentação Técnica

## 🎯 Visão Geral

Sistema completo de importação de dados via Excel formatado com cálculos automáticos, validação e armazenamento em banco de dados.

---

## 📋 Estrutura da Planilha Excel

### Seção 1: Resumo Financeiro (Linhas 1-4)
```
┌─────────────────┬──────────┐
│ Receita POSTO   │  1000.00 │  ← Célula B1
│ Receita APP     │   500.00 │  ← Célula B2
│ Receita PIX     │   300.00 │  ← Célula B3
│ Receita CARTÃO  │   200.00 │  ← Célula B4
└─────────────────┴──────────┘

Total Receita = 2000.00 (calculado automaticamente)
```

### Seção 2: Tabela de Equipamentos (Linhas 6+)
```
┌──────────────┬────────────┬────────────────┬────────────┬──────────────┐
│ Equipamento  │ Tempo min  │ Valor/Aspira   │ Quantidade │ Valor Total  │
├──────────────┼────────────┼────────────────┼────────────┼──────────────┤
│ Aspirador 1  │   120      │     5.00       │     10     │   50.00      │
│ Aspirador 2  │    90      │     3.00       │      5     │   15.00      │
│ Bomba 1      │   180      │     8.00       │      2     │   16.00      │
└──────────────┴────────────┴────────────────┴────────────┴──────────────┘

Coluna E: Valor Total = Valor/Aspira (C) × Quantidade (D)
         50.00 = 5.00 × 10
         15.00 = 3.00 × 5
         16.00 = 8.00 × 2
```

---

## 🔧 Fluxo de Processamento

```
┌─────────────────────────────────────────────────────────────┐
│ 1️⃣ USUÁRIO GERA PLANILHA MODELO                            │
│    └─→ ExcelTemplateGenerator.tsx                           │
│         └─→ XLSX.utils.book_new() cria novo workbook      │
│             └─→ Aba "Importação" com formatação            │
│             └─→ Aba "Instruções" com guia completo         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2️⃣ USUÁRIO PREENCHE PLANILHA                               │
│    └─→ Valores manualmente no Excel/Sheets                 │
│         └─→ Coluna B: resumo financeiro                    │
│         └─→ Colunas A-D: dados de equipamentos             │
│         └─→ Coluna E: fórmulas ou valores                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3️⃣ USUÁRIO FAZ UPLOAD PLANILHA                             │
│    └─→ ExcelUploader.tsx                                    │
│         └─→ Input file aceita .xlsx                        │
│         └─→ Valida tipo de arquivo                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4️⃣ PROCESSAMENTO NO NAVEGADOR (Client-Side)                │
│    └─→ XLSX.read() com cellFormula + cellStyles            │
│         ├─→ Extrai Resumo: B1, B2, B3, B4                  │
│         │   └─→ Calcula: totalReceita = soma de 4 valores  │
│         │                                                    │
│         └─→ Extrai Tabela: Linhas 7+                       │
│             ├─→ Célula A: Equipamento                      │
│             ├─→ Célula B: Tempo em min                     │
│             ├─→ Célula C: Valor por aspira                 │
│             ├─→ Célula D: Quantidade                       │
│             └─→ Célula E: Valor Total                      │
│                                                              │
│         └─→ CALCULA: valorTotal = C × D                    │
│             └─→ Arredonda para 2 casas decimais            │
│             └─→ Valida dados (não NaN)                     │
│                                                              │
│         └─→ Exibe preview na tela                          │
│             ├─→ Cards com cada receita                     │
│             ├─→ Total de receita                           │
│             ├─→ Tabela com todas as linhas                 │
│             └─→ Valores formatados em R$                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5️⃣ USUÁRIO CLICA "SALVAR NO BANCO"                         │
│    └─→ Button: "💾 Salvar no Banco de Dados"               │
│         └─→ handleSaveToDB() chamado                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6️⃣ ENVIO PARA API (Server-Side)                            │
│    └─→ POST /api/excel/import                              │
│         └─→ Recebe JSON com:                               │
│             ├─→ summary: {receitaPosto, receitaApp, ...}   │
│             └─→ tableData: [{equipamento, tempo, ...}]     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7️⃣ SALVA RESUMO NO BANCO (excel_imports)                   │
│    └─→ INSERT com service_role (bypass RLS)                │
│         ├─→ receita_posto                                  │
│         ├─→ receita_app                                    │
│         ├─→ receita_pix                                    │
│         ├─→ receita_cartao                                 │
│         ├─→ total_receita                                  │
│         ├─→ imported_at: NOW()                             │
│         └─→ Retorna importId                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8️⃣ SALVA LINHAS NO BANCO (excel_import_rows)               │
│    └─→ INSERT com service_role (bypass RLS)                │
│         Para cada linha:                                    │
│         ├─→ import_id (FK de excel_imports)                │
│         ├─→ equipamento                                    │
│         ├─→ tempo_em_min                                   │
│         ├─→ valor_por_aspira                               │
│         ├─→ quantidade                                     │
│         ├─→ saldo_utilizado (= valor_total)                │
│         ├─→ valor_total (C × D, já calculado)              │
│         └─→ created_at: NOW()                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9️⃣ SUCESSO!                                                │
│    └─→ Alert: "✅ Dados importados! 3 linhas salvas."      │
│         └─→ Limpa form                                     │
│         └─→ Usuário pode fazer novo upload                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Estrutura do Banco de Dados

### Tabela: `excel_imports` (Resumo)
```sql
├─ id: BIGINT (PK)
├─ receita_posto: DECIMAL(10,2)
├─ receita_app: DECIMAL(10,2)
├─ receita_pix: DECIMAL(10,2)
├─ receita_cartao: DECIMAL(10,2)
├─ total_receita: DECIMAL(10,2) -- CALCULADO: soma
├─ imported_at: TIMESTAMPTZ -- Data do upload
├─ created_at: TIMESTAMPTZ
└─ updated_at: TIMESTAMPTZ
```

### Tabela: `excel_import_rows` (Detalhes)
```sql
├─ id: BIGINT (PK)
├─ import_id: BIGINT (FK → excel_imports.id)
├─ equipamento: VARCHAR(255)
├─ tempo_em_min: INTEGER
├─ valor_por_aspira: DECIMAL(10,2)
├─ quantidade: INTEGER
├─ saldo_utilizado: DECIMAL(10,2) -- IGUAL a valor_total
├─ valor_total: DECIMAL(10,2) -- CALCULADO: valor_por_aspira × quantidade
├─ created_at: TIMESTAMPTZ
└─ updated_at: TIMESTAMPTZ
```

---

## 🧮 Fórmulas e Cálculos

### No Frontend (JavaScript)
```javascript
// Resumo
totalReceita = receitaPosto + receitaApp + receitaPix + receitaCartao

// Cada linha
valorTotal = valorPorAspira × quantidade
// Exemplo: 5.00 × 10 = 50.00

// Arredondamento (2 casas decimais)
valorTotal = Math.round(valorTotal * 100) / 100
// Evita: 0.1 + 0.2 = 0.30000000000000004
```

### No SQL (Banco de Dados)
```sql
-- Trigger: auto-update updated_at
CREATE TRIGGER update_excel_imports_updated_at
  BEFORE UPDATE ON excel_imports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_excel_imports_imported_at ON excel_imports(imported_at DESC);
CREATE INDEX idx_excel_import_rows_import_id ON excel_import_rows(import_id);
```

---

## 🔐 Segurança

### RLS Policies (Row Level Security)
```sql
-- Admins podem ver
SELECT: role = 'admin' → TRUE
INSERT: role = 'admin' → TRUE
UPDATE: role = 'admin' → TRUE
DELETE: role = 'admin' → TRUE

-- Service role (API) tem acesso total
FOR ALL TO service_role → TRUE (bypass RLS)
```

### API Protection
- POST `/api/excel/import` usa `supabaseServer` com `SUPABASE_SERVICE_ROLE_KEY`
- RLS não bloqueia inserts vindos do servidor
- Dados validados no frontend antes de envio

---

## 📝 Validações

### Frontend
```javascript
✓ Arquivo deve ser .xlsx
✓ Resumo: B1-B4 não vazios
✓ Equipamento: não pode ser vazio
✓ Valores: devem ser números
✓ valorTotal: não pode ser NaN
✓ Máximo 100 linhas de equipamento
```

### Backend (API)
```javascript
✓ Body contém summary e tableData
✓ service_role key presente
✓ Foreign key (import_id) válida
✓ Transaction rollback se falhar
```

---

## 🎨 Interface do Usuário

### ExcelTemplateGenerator
```
┌─────────────────────────────────────────────────┐
│ 📋 Gerador de Planilha Excel                    │
├─────────────────────────────────────────────────┤
│ Como usar:                                      │
│ 1. Clique no botão abaixo                       │
│ 2. Abra no Excel/Google Sheets                  │
│ 3. Preencha os valores                          │
│ 4. Salve o arquivo                              │
│ 5. Use a aba "Upload" para importar             │
├─────────────────────────────────────────────────┤
│ ⚠️ Importante: Não altere os rótulos            │
├─────────────────────────────────────────────────┤
│ [📥 Gerar Planilha Excel]                       │
└─────────────────────────────────────────────────┘
```

### ExcelUploader
```
┌─────────────────────────────────────────────────┐
│ 📤 Upload Planilha Preenchida                   │
├─────────────────────────────────────────────────┤
│ [📁 Selecione arquivo...]                       │
├─────────────────────────────────────────────────┤
│ 📊 RESUMO FINANCEIRO                            │
│ ┌──────────┬──────────┬──────────┬──────────┐   │
│ │POSTO     │APP       │PIX       │CARTÃO    │   │
│ │1000.00   │500.00    │300.00    │200.00    │   │
│ └──────────┴──────────┴──────────┴──────────┘   │
│ Total: R$ 2000.00                               │
├─────────────────────────────────────────────────┤
│ 📋 EQUIPAMENTOS (3 linhas)                      │
│ ┌─────────────┬──────┬──────┬────┬────────┐    │
│ │Equipamento  │Tempo │Valor │Qtd │Total   │    │
│ ├─────────────┼──────┼──────┼────┼────────┤    │
│ │Aspirador 1  │120   │5.00  │10  │50.00   │    │
│ │Aspirador 2  │90    │3.00  │5   │15.00   │    │
│ │Bomba 1      │180   │8.00  │2   │16.00   │    │
│ └─────────────┴──────┴──────┴────┴────────┘    │
├─────────────────────────────────────────────────┤
│ [💾 Salvar no Banco de Dados]                   │
└─────────────────────────────────────────────────┘
```

---

## 📊 Dados de Exemplo

### Entrada (Excel)
```
Receita POSTO       1250.00
Receita APP          750.00
Receita PIX          500.00
Receita CARTÃO      1000.00

Equipamento  Tempo  Valor   Qtd  Total
Asp. 1       120    5.00    20   100.00
Asp. 2       150    4.50    15   67.50
Bomba        180    10.00    5   50.00
```

### Processamento
```javascript
summary = {
  receitaPosto: 1250.00,
  receitaApp: 750.00,
  receitaPix: 500.00,
  receitaCartao: 1000.00,
  totalReceita: 3500.00  // Calculado
}

tableData = [
  { equipamento: 'Asp. 1', tempoEmMin: 120, valorPorAspira: 5.00, quantidade: 20, valorTotal: 100.00 },
  { equipamento: 'Asp. 2', tempoEmMin: 150, valorPorAspira: 4.50, quantidade: 15, valorTotal: 67.50 },
  { equipamento: 'Bomba', tempoEmMin: 180, valorPorAspira: 10.00, quantidade: 5, valorTotal: 50.00 }
]
```

### Saída (Banco de Dados)
```sql
-- excel_imports
INSERT INTO excel_imports (receita_posto, receita_app, receita_pix, receita_cartao, total_receita)
VALUES (1250.00, 750.00, 500.00, 1000.00, 3500.00)
→ id: 42

-- excel_import_rows
INSERT INTO excel_import_rows (import_id, equipamento, tempo_em_min, valor_por_aspira, quantidade, valor_total, saldo_utilizado)
VALUES 
  (42, 'Asp. 1', 120, 5.00, 20, 100.00, 100.00),
  (42, 'Asp. 2', 150, 4.50, 15, 67.50, 67.50),
  (42, 'Bomba', 180, 10.00, 5, 50.00, 50.00)
```

---

## ✅ Checklist de Implementação

- [x] ExcelTemplateGenerator com formatação profissional
- [x] ExcelUploader com validação completa
- [x] Cálculos automáticos (valorTotal = valor × qtd)
- [x] Extração de dados por célula (B1-B4, A7+)
- [x] API POST /api/excel/import com service_role
- [x] Tabelas: excel_imports + excel_import_rows
- [x] RLS policies para admin + service_role
- [x] TypeScript strict mode
- [x] Tailwind CSS responsivo
- [x] Error handling completo
- [x] Build compila sem erros

---

## 🚀 Próximos Passos (Opcional)

1. Dashboard de importações anteriores
2. Filtros por data/período
3. Exportar relatório de importação
4. Duplicação detectada
5. Validação de duplicatas antes de salvar
6. Resumo estatístico das importações
7. Associar importação com usuário

---

**Status:** ✅ IMPLEMENTADO E PRONTO PARA USO
**Build:** Compilado com sucesso (33 rotas)
**Commits:** Todos os commits realizados com sucesso
