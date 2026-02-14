# Checklist de Fusão - ML Gestão Integral

## ✅ Fase 0: Preparação (COMPLETO)

- [x] Repositório criado: https://github.com/JohnGomes84/ml-gestao-integral
- [x] README.md com visão geral
- [x] Guia de fusão (docs/FUSAO.md)
- [x] Documentação do schema (docs/SCHEMA.md)
- [x] package.json unificado
- [x] .gitignore
- [x] .env.example
- [x] Configs: tsconfig.json, vite.config.ts, drizzle.config.ts

---

## 📋 Fase 1: Clonar Repositórios (Você)

```bash
cd ~/projects/
git clone https://github.com/JohnGomes84/gestao-operacional.git
git clone https://github.com/JohnGomes84/rh-prime.git
git clone https://github.com/JohnGomes84/ml-gestao-integral.git
```

- [ ] Clonados lado a lado
- [ ] Todos na mesma pasta pai

---

## 📋 Fase 2: Estrutura de Pastas (Você)

```bash
cd ml-gestao-integral

# Client
mkdir -p client/src/{pages,components,lib,hooks}
mkdir -p client/src/pages/{dashboard,operational,clt,financial,compliance}
mkdir -p client/src/pages/operational/{operations,workers,clients,locations,shifts,reports,leader}
mkdir -p client/src/pages/clt/{employees,vacations,payroll,health,documents}

# Server
mkdir -p server/{_core,db,routes,functions,middleware}
mkdir -p server/functions/{operational,clt,financial,compliance}

# Shared
mkdir -p shared/types

# Drizzle
mkdir -p drizzle/migrations
```

- [ ] Estrutura criada
- [ ] Verificar com `tree -L 3`

---

## 📋 Fase 3: Copiar Base (gestao-operacional)

### Configs
```bash
cp ../gestao-operacional/.prettierrc ./
cp ../gestao-operacional/.prettierignore ./
cp ../gestao-operacional/components.json ./
```

### Client base
```bash
cp -r ../gestao-operacional/client/src/components/* ./client/src/components/
cp -r ../gestao-operacional/client/src/lib/* ./client/src/lib/
cp -r ../gestao-operacional/client/src/hooks/* ./client/src/hooks/
cp ../gestao-operacional/client/src/main.tsx ./client/src/
cp ../gestao-operacional/client/src/App.tsx ./client/src/
cp ../gestao-operacional/client/index.html ./client/
```

### Server base
```bash
cp -r ../gestao-operacional/server/_core/* ./server/_core/
cp -r ../gestao-operacional/server/middleware/* ./server/middleware/
```

- [ ] Configs copiados
- [ ] Client base copiado
- [ ] Server base copiado

---

## 📋 Fase 4: Módulo Operacional

### Backend
```bash
# Schema (temporariamente separado)
cp ../gestao-operacional/server/db/schema.ts ./server/db/schema-operational.ts

# Funções
cp ../gestao-operacional/server/functions/operations.ts ./server/functions/operational/
cp ../gestao-operacional/server/functions/workers.ts ./server/functions/operational/
cp ../gestao-operacional/server/functions/clients.ts ./server/functions/operational/
cp ../gestao-operacional/server/functions/locations.ts ./server/functions/operational/
cp ../gestao-operacional/server/functions/shifts.ts ./server/functions/operational/
cp ../gestao-operacional/server/functions/contracts.ts ./server/functions/operational/
cp ../gestao-operacional/server/functions/workerRefusals.ts ./server/functions/compliance/
cp ../gestao-operacional/server/functions/workerAutonomy.ts ./server/functions/compliance/

# Rotas
cp ../gestao-operacional/server/routes/*.ts ./server/routes/
```

### Frontend
```bash
cp -r ../gestao-operacional/client/src/pages/operations/* ./client/src/pages/operational/operations/
cp -r ../gestao-operacional/client/src/pages/workers/* ./client/src/pages/operational/workers/
cp -r ../gestao-operacional/client/src/pages/clients/* ./client/src/pages/operational/clients/
cp -r ../gestao-operacional/client/src/pages/locations/* ./client/src/pages/operational/locations/
cp -r ../gestao-operacional/client/src/pages/shifts/* ./client/src/pages/operational/shifts/
cp -r ../gestao-operacional/client/src/pages/contracts/* ./client/src/pages/operational/contracts/
cp -r ../gestao-operacional/client/src/pages/reports/* ./client/src/pages/operational/reports/
cp -r ../gestao-operacional/client/src/pages/leader/* ./client/src/pages/operational/leader/
cp ../gestao-operacional/client/src/pages/WorkerRegistration.tsx ./client/src/pages/operational/
cp ../gestao-operacional/client/src/pages/PendingWorkers.tsx ./client/src/pages/operational/
```

- [ ] Backend operacional copiado
- [ ] Frontend operacional copiado
- [ ] Verificar files com `ls -la`

---

## 📋 Fase 5: Módulo CLT

### Backend
```bash
# Schema (temporariamente separado)
cp ../rh-prime/server/db/schema.ts ./server/db/schema-clt.ts

# Funções
cp ../rh-prime/server/functions/employees.ts ./server/functions/clt/
cp ../rh-prime/server/functions/vacations.ts ./server/functions/clt/
cp ../rh-prime/server/functions/payroll.ts ./server/functions/clt/
cp ../rh-prime/server/functions/healthDocuments.ts ./server/functions/clt/
cp ../rh-prime/server/functions/documents.ts ./server/functions/clt/
cp ../rh-prime/server/functions/digitalSignatures.ts ./server/functions/clt/
cp ../rh-prime/server/functions/auditLogs.ts ./server/functions/compliance/

# Rotas (só as funcionais)
cp ../rh-prime/server/routes/employees.ts ./server/routes/
cp ../rh-prime/server/routes/vacations.ts ./server/routes/
cp ../rh-prime/server/routes/payroll.ts ./server/routes/
cp ../rh-prime/server/routes/healthDocuments.ts ./server/routes/
cp ../rh-prime/server/routes/documents.ts ./server/routes/
cp ../rh-prime/server/routes/digitalSignatures.ts ./server/routes/
cp ../rh-prime/server/routes/auditLogs.ts ./server/routes/
```

### Frontend (só o funcional)
```bash
cp -r ../rh-prime/client/src/pages/employees/* ./client/src/pages/clt/employees/
cp -r ../rh-prime/client/src/pages/vacations/* ./client/src/pages/clt/vacations/
cp -r ../rh-prime/client/src/pages/health/* ./client/src/pages/clt/health/
cp -r ../rh-prime/client/src/pages/documents/* ./client/src/pages/clt/documents/
```

**NÃO COPIAR (UI órfã):**
- ~~recruitment~~ (0% funcional)
- ~~timeTracking~~ (0% funcional)
- ~~assessments~~ (0% funcional)

- [ ] Backend CLT copiado
- [ ] Frontend CLT copiado (só funcional)
- [ ] UI órfã ignorada

---

## 📋 Fase 6: Schema Unificado

### Criar schema.ts unificado

O schema completo está em `docs/SCHEMA.md`. Copie para `server/db/schema.ts`.

Ou use Cursor para mesclar:
1. Abrir `server/db/schema-operational.ts`
2. Abrir `server/db/schema-clt.ts`
3. Abrir `docs/SCHEMA.md`
4. Pedir ao Cursor: "Mescle os dois schemas usando o template do SCHEMA.md"

- [ ] `server/db/schema.ts` criado
- [ ] Schema unificado (workers + employees)
- [ ] Deletar schemas temporários

---

## 📋 Fase 7: Dependências

```bash
cd ml-gestao-integral
pnpm install
```

- [ ] `pnpm install` executado
- [ ] `node_modules/` criado
- [ ] Sem erros de dependências

---

## 📋 Fase 8: Banco de Dados

### Configurar .env
```bash
cp .env.example .env
nano .env
```

Editar:
```env
DATABASE_URL=mysql://root:SUA_SENHA@localhost:3306/ml_gestao_integral
JWT_SECRET=alguma-chave-secreta-aleatoria
AWS_ACCESS_KEY_ID=sua-chave-aws
AWS_SECRET_ACCESS_KEY=sua-secret-aws
AWS_REGION=us-east-1
AWS_BUCKET_NAME=ml-gestao-documents
```

### Criar banco
```bash
mysql -u root -p
CREATE DATABASE ml_gestao_integral;
EXIT;
```

### Executar migrations
```bash
pnpm db:push
```

- [ ] .env configurado
- [ ] Banco criado
- [ ] Migrations executadas
- [ ] Tabelas criadas (verificar no MySQL)

---

## 📋 Fase 9: Ajustar Imports

### Problema comum

Imports relativos quebram após copiar arquivos:

```typescript
// Antes
import { workers } from '../db/schema';

// Quebra porque path mudou
```

### Solução: usar alias

```typescript
// Depois (usar alias do tsconfig)
import { workers } from '@/server/db/schema';
```

**Como fazer:**
1. Abrir Cursor
2. Buscar todos os imports relativos
3. Substituir por aliases

Ou usar find/replace:
```bash
# Exemplo
find server -name "*.ts" -exec sed -i "s|from '../db/schema'|from '@/server/db/schema'|g" {} \;
```

- [ ] Imports ajustados no server/
- [ ] Imports ajustados no client/
- [ ] Build funciona: `pnpm check`

---

## 📋 Fase 10: Atualizar Rotas

### App.tsx

Editar `client/src/App.tsx` para incluir todas as rotas:

```typescript
import { Route, Switch } from 'wouter';

// Importar páginas
import Dashboard from './pages/dashboard/Dashboard';
import Operations from './pages/operational/operations/Operations';
import Workers from './pages/operational/workers/Workers';
import Employees from './pages/clt/employees/Employees';
import Vacations from './pages/clt/vacations/Vacations';
// ... etc

function App() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      
      {/* Operacional */}
      <Route path="/operacoes" component={Operations} />
      <Route path="/trabalhadores" component={Workers} />
      
      {/* CLT */}
      <Route path="/funcionarios-clt" component={Employees} />
      <Route path="/ferias-clt" component={Vacations} />
      
      {/* ... mais rotas */}
    </Switch>
  );
}
```

- [ ] Rotas operacionais adicionadas
- [ ] Rotas CLT adicionadas
- [ ] Imports corretos

---

## 📋 Fase 11: Testar

```bash
pnpm dev
```

Abrir: http://localhost:5000

### Checklist de testes

**Auth:**
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Roles funcionam (admin, leader, worker)

**Operacional:**
- [ ] Dashboard carrega
- [ ] Listar operações
- [ ] Criar operação
- [ ] Aceitar operação (líder)
- [ ] Check-in trabalhador
- [ ] Check-out trabalhador
- [ ] Listar trabalhadores
- [ ] Aprovar cadastro pendente
- [ ] Relatório quinzenal

**CLT:**
- [ ] Listar funcionários CLT
- [ ] Criar funcionário CLT
- [ ] Solicitar férias
- [ ] Aprovar férias
- [ ] Dashboard de saúde (ASO/PGR)

**Compliance:**
- [ ] Bloqueio por continuidade funciona
- [ ] Score de autonomia calcula
- [ ] Audit log registra ações

---

## 📋 Fase 12: Resolver Conflitos

### Types duplicados

Se houver erros de types duplicados, criar types unificados em `shared/types/`.

### Auth duplicado

Usar o auth do gestao-operacional (mais recente).

### Dashboard duplicado

Criar dashboard unificado (Fase 5 do roadmap, 20 créditos).

- [ ] Conflitos de types resolvidos
- [ ] Auth unificado
- [ ] Sem duplicações

---

## 📋 Fase 13: Commit e Push

```bash
git add .
git commit -m "feat: fusão completa - sistema operacional + CLT"
git push origin main
```

- [ ] Commit feito
- [ ] Push feito
- [ ] GitHub atualizado

---

## ✅ STATUS FINAL

- [ ] **Sistema unificado funcionando**
- [ ] **Todos os testes passando**
- [ ] **Documentação completa**
- [ ] **Pronto para próxima fase (Dashboard + Financeiro)**

---

## 🚀 Próximos Passos (Após Fusão)

### Fase 5: Dashboard Unificado (20 créditos)
- [ ] Cards operacionais
- [ ] Cards CLT
- [ ] Cards financeiros
- [ ] Cards de compliance

### Fase 6: Módulo Financeiro (30 créditos)
- [ ] Pagamentos unificados
- [ ] Cálculos por tipo
- [ ] Relatórios consolidados

### Fase 7: Deploy (10 créditos)
- [ ] Docker compose
- [ ] CI/CD
- [ ] Testes end-to-end

---

**Última atualização:** 14/02/2026
