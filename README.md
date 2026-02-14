# ML Gestão Integral

## Sistema Unificado de Gestão Trabalhista

Sistema completo para gerenciar múltiplos tipos de vínculos trabalhistas com foco em conformidade legal brasileira.

---

## 🎯 Visão Geral

O **ML Gestão Integral** é a fusão estratégica de dois sistemas:
- **gestao-operacional** (diaristas, MEI, freelancers)
- **rh-prime** (CLT, folha, férias, compliance)

Resultado: plataforma única que gerencia **todos os tipos de trabalhadores** sob o mesmo teto.

---

## 📦 Módulos

### 1. Módulo Operacional
**Origem:** gestao-operacional (75% pronto)

- ✅ Sistema de operações (missões com líder)
- ✅ Gestão de diaristas e MEI
- ✅ Check-in/out com geolocalização
- ✅ Controle de continuidade (bloqueio automático)
- ✅ Score de autonomia (compliance trabalhista)
- ✅ Dashboard do líder (mobile-friendly)
- ✅ Relatórios quinzenais de pessoas-dia
- ✅ Registro de ocorrências
- ✅ Gestão de turnos personalizáveis

### 2. Módulo CLT
**Origem:** rh-prime (60% pronto)

- ✅ Autenticação RBAC (3 roles)
- ✅ Assinatura digital Gov.br
- ✅ Auditoria por CPF
- ⚠️ Gestão de funcionários CLT (70%)
- ⚠️ Férias e licenças (70%)
- ⚠️ Saúde e segurança - ASO/PGR/PCMSO (60%)
- ⚠️ GED - Documentos (80%)
- ❌ Folha de pagamento (schema pronto, UI faltando)

### 3. Módulo Financeiro
**Status:** A implementar (híbrido)

- [ ] Pagamentos por tipo de vínculo
- [ ] Cálculo automático (diária, MEI, CLT)
- [ ] Faturamento por cliente
- [ ] Rentabilidade por operação
- [ ] Dashboard financeiro consolidado
- [ ] Integração PIX
- [ ] Geração de recibos

### 4. Módulo Compliance
**Status:** A implementar (híbrido)

- ✅ Bloqueio por continuidade (diaristas)
- ✅ Score de autonomia
- [ ] Dashboard de riscos trabalhistas
- [ ] Cálculo de exposição financeira
- [ ] Relatórios de conformidade
- [ ] Exportação para auditorias

---

## 🏗️ Arquitetura

```
ml-gestao-integral/
├─ client/                    # Frontend React 19 + TypeScript
│  └─ src/
│     ├─ pages/
│     │  ├─ dashboard/       # Dashboard unificado
│     │  ├─ operational/     # Operações, diaristas, MEI
│     │  ├─ clt/            # Funcionários CLT, férias, folha
│     │  ├─ financial/      # Gestão financeira
│     │  └─ compliance/     # Riscos e conformidade
│     └─ components/        # Componentes compartilhados
├─ server/                   # Backend Node + Express + tRPC
│  ├─ db/
│  │  └─ schema.ts          # Schema unificado (Drizzle)
│  ├─ routes/               # APIs tRPC
│  └─ functions/            # Lógica de negócio
└─ shared/                   # Types compartilhados
```

### Stack Tecnológico
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS, Radix UI
- **Backend:** Node.js, Express, tRPC, Drizzle ORM
- **Banco:** MySQL
- **Storage:** AWS S3
- **Auth:** JWT + bcrypt
- **Deploy:** Docker, esbuild

---

## 🚀 Roadmap de Fusão

### Fase 1: Preparação ✅
- [x] Criar repositório
- [x] Estrutura base
- [ ] Schema unificado
- [ ] Migrations iniciais

### Fase 2: Importar Backend (50 créditos)
- [ ] Schema CLT (employees, contracts, vacations, payroll)
- [ ] Funções de gestão CLT
- [ ] Funções de folha de pagamento
- [ ] Funções de saúde (ASO/PGR/PCMSO)
- [ ] APIs tRPC correspondentes

### Fase 3: Importar Frontend (40 créditos)
- [ ] Páginas de funcionários CLT
- [ ] Páginas de férias
- [ ] Páginas de folha de pagamento
- [ ] Páginas de saúde e segurança
- [ ] Adaptar rotas

### Fase 4: Dashboard Unificado (20 créditos)
- [ ] Cards operacionais
- [ ] Cards CLT
- [ ] Cards financeiros
- [ ] Cards de compliance

### Fase 5: Módulo Financeiro (30 créditos)
- [ ] Pagamentos unificados
- [ ] Cálculos por tipo
- [ ] Relatórios consolidados

### Fase 6: Deploy (10 créditos)
- [ ] Docker compose
- [ ] CI/CD
- [ ] Documentação
- [ ] Testes end-to-end

**Total:** 180 créditos / 12 semanas

---

## 📊 Tipos de Trabalhadores Suportados

| Tipo | Origem | Pagamento | Compliance | Status |
|------|--------|-----------|------------|---------|
| **Diarista** | gestao-operacional | Diária | Bloqueio por continuidade | ✅ 100% |
| **MEI** | gestao-operacional | Por operação + NF | Score de autonomia | ⚠️ 80% |
| **Freelancer** | gestao-operacional | Por projeto | Score de autonomia | ✅ 100% |
| **CLT** | rh-prime | Mensal (folha) | ASO/Férias/FGTS | ⚠️ 60% |

---

## 🔐 Conformidade Legal

### Diaristas e Freelancers
- ✅ Bloqueio automático após 3 dias consecutivos
- ✅ Score de autonomia (múltiplos clientes/locais)
- ✅ Documentação de recusas
- ✅ Relatórios para defesa trabalhista

### CLT
- ✅ Cálculo CLT completo (INSS, IR, FGTS)
- ✅ Controle de férias (30 dias/ano)
- ✅ ASO, PGR, PCMSO (NR-7, NR-1)
- ✅ Auditoria por CPF
- ✅ Assinatura digital Gov.br

---

## 🛠️ Instalação

```bash
# Clone o repositório
git clone https://github.com/JohnGomes84/ml-gestao-integral.git
cd ml-gestao-integral

# Instale dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Execute migrations
pnpm db:push

# Inicie desenvolvimento
pnpm dev
```

Acesse: http://localhost:5000

---

## 📝 Variáveis de Ambiente

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/ml_gestao

# Auth
JWT_SECRET=your-secret-key

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=ml-gestao-documents

# Gov.br (opcional)
GOVBR_CLIENT_ID=your-client-id
GOVBR_CLIENT_SECRET=your-client-secret
```

---

## 📚 Documentação

- [Guia de Fusão](./docs/FUSAO.md) - Processo de migração dos sistemas
- [Schema Unificado](./docs/SCHEMA.md) - Estrutura do banco de dados
- [APIs](./docs/API.md) - Documentação das rotas tRPC
- [Compliance](./docs/COMPLIANCE.md) - Conformidade legal brasileira

---

## 🤝 Contribuindo

Este é um sistema privado da Master Log Serviços. Contribuições internas são bem-vindas.

---

## 📄 Licença

MIT

---

## 🏢 Sobre

**Master Log Serviços LTDA**  
Sistema desenvolvido para gestão integral de operações e trabalhadores.

**Versão:** 1.0.0 (em fusão)  
**Última atualização:** Fevereiro 2026
