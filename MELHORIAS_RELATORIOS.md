# 📊 Melhorias no Sistema de Relatórios e Repasse

Data: 16 de Novembro de 2025

## ✅ Alterações Realizadas

### 1. **Adição do Campo de Endereço**
- **Migration:** `007_add_address_to_machines.sql`
- **Mudança:** Adicionada coluna `address VARCHAR(255)` na tabela `machines`
- **Propósito:** Armazenar o endereço completo do equipamento
- **Índice:** Criado índice para melhor performance em filtros

### 2. **Atualização do Formulário de Adicionar Máquina**
- **Arquivo:** `src/components/AddMachineForm.tsx`
- **Mudanças:**
  - Adicionado campo de input para "Endereço" (obrigatório)
  - Renomeado "Localização" para "Localização (Cidade)"
  - Validação: Cidade e endereço agora são obrigatórios
  - Dados enviados para Supabase: ID, Localização (Cidade), Endereço

### 3. **Melhoria do PDF de Equipamento**
- **Arquivo:** `src/components/Dashboard.tsx` - Função `handleDownloadMachinePdf`
- **Melhorias Implementadas:**
  - ✅ Cabeçalho profissional com cores personalizadas
  - ✅ **ID da Máquina** (adicionado)
  - ✅ **Cidade** (localização)
  - ✅ **Endereço** (novo campo)
  - ✅ **Resumo de Uso** com:
    - Total de acionamentos
    - Tempo total de uso (em horas e minutos)
    - Última limpeza
  - ✅ Tabela formatada de histórico de acionamentos
  - ✅ Rodapé com data de geração
  - Arquivo gerado: `relatorio_maquina_[ID].pdf`

### 4. **Criação do PDF de Repasse**
- **Arquivo:** `src/components/Dashboard.tsx` - Função `handleDownloadRepaymentPdf`
- **Conteúdo do PDF:**
  - ✅ Período de referência (mês atual por padrão)
  - ✅ **Informações do Equipamento:**
    - ID da máquina
    - Cidade
    - Endereço
  - ✅ **Resumo de Uso (APIRACAR):**
    - Total de acionamentos
    - Tempo total de uso em horas e minutos
  - ✅ **Informações Financeiras:**
    - Tarifa por minuto: R$ 0.50 (configurável)
    - Total de minutos de uso
    - Valor total do período
    - Valor APIRACAR (30%)
    - Seu Repasse (70%)
  - ✅ Tabela histórico detalhado de acionamentos
  - ✅ Rodapé profissional
  - Arquivo gerado: `repasse_maquina_[ID]_[YYYYMM].pdf`

### 5. **Adição de Botões de Download**
- **Arquivo:** `src/components/Dashboard.tsx` - Seção de Equipamentos
- **Botões adicionados:**
  - 📄 **"Baixar PDF Equipamento"** - Gera relatório do equipamento
  - 💰 **"Baixar PDF Repasse"** - Gera documento de repasse mensal

### 6. **Melhoria da Página de Faturamento**
- **Arquivo:** `src/components/Dashboard.tsx` - Seção `case 'faturamento'`
- **Mudanças:**
  - Renomeado para "Faturamento e Repasse"
  - ✅ Adicionada **Tabela de Resumo de Uso por Equipamento:**
    - ID do Equipamento
    - Localização
    - Número de acionamentos
    - Tempo total (em horas e minutos)
    - **Repasse (70%)** em R$
  - ✅ Cards de resumo financeiro mantidos:
    - Receita Total
    - Despesas
    - Lucro Líquido
  - ✅ Tabelas adicionais mantidas:
    - Faturamento por método de pagamento
    - Top clientes

### 7. **Histórico de Acionamentos com Download**
- **Arquivo:** `src/components/Dashboard.tsx` - Função `handleDownloadHistoryData`
- **Melhorias:**
  - ✅ Filtros por data já existentes (Data início / Data fim)
  - ✅ **Novo botão:** "⬇️ Baixar CSV"
  - **Funcionalidade:** Exporta histórico filtrado em formato CSV com colunas:
    - ID
    - Máquina ID
    - Localização
    - Data/Hora Início
    - Comando
    - Duração (minutos)
    - Temperatura Média
    - Status
  - Arquivo gerado: `historico_acionamentos_[YYYY-MM-DD].csv`

## 📋 Fluxo de Uso

### Para Gerar Relatório de Equipamento:
1. Acesse **Equipamentos** no menu
2. Clique em **"Detalhes"** para expandir a máquina
3. Clique em **"📄 Baixar PDF Equipamento"**
4. PDF com informações completas será baixado

### Para Gerar Documento de Repasse:
1. Acesse **Equipamentos** no menu
2. Clique em **"Detalhes"** para expandir a máquina
3. Clique em **"💰 Baixar PDF Repasse"**
4. PDF com financeiro e resumo de uso será gerado

### Para Visualizar Resumo de Uso:
1. Acesse **Faturamento e Repasse**
2. Visualize a tabela **"📊 Resumo de Uso por Equipamento"**
3. Veja minutagem e repasse calculado para cada equipamento

### Para Baixar Histórico de Acionamentos:
1. Acesse **Histórico de Acionamentos**
2. Selecione período (Data início e Data fim)
3. Clique em **"⬇️ Baixar CSV"**
4. Arquivo CSV será baixado com todos os dados filtrados

## 🔧 Configuração de Tarifa

A tarifa de R$ 0.50 por minuto está **hardcoded** nos PDFs. Para alterar:

**No arquivo `src/components/Dashboard.tsx`:**

- Linha ~445: `const minuteRate = 0.50;` (PDF Equipamento)
- Linha ~755: `const minuteRate = 0.50;` (Página Faturamento)
- Linha ~440: `const minuteRate = 0.50;` (PDF Repasse)

## 📝 Notas Importantes

1. **Campo de Endereço:** 
   - Agora obrigatório no cadastro
   - Será exibido em todos os relatórios
   - Já está implementado na migration

2. **Cálculo de Repasse:**
   - 70% para você (proprietário do equipamento)
   - 30% para APIRACAR
   - Base: R$ 0.50 por minuto de uso

3. **PDFs:**
   - Gerados dinamicamente pela biblioteca `jsPDF`
   - Incluem todas as informações solicitadas
   - Formatação profissional com cores e tabelas

4. **CSV:**
   - Baixado com timestamp da data de geração
   - Utiliza ponto e vírgula como separador
   - Compatível com Excel/Sheets

## 🚀 Próximos Passos Sugeridos

1. **Personalizar tarifas por equipamento** (se necessário)
2. **Adicionar logo/brasão nos PDFs** (se desejar)
3. **Configurar período de repasse** (ex: semanal, quinzenal, mensal)
4. **Integrar envio automático de PDFs por email**
5. **Criar dashboard de análise de tendências**

---

**Status:** ✅ Todas as solicitações implementadas e testadas
**Repositório:** GitHub - projeto-arnaldo-upcaraspiradores
**Commit:** c69c405
