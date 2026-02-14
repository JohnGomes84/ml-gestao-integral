# Guia de Fusão dos Sistemas

## Visão Geral

Este documento descreve o processo de fusão entre:
- **gestao-operacional** (sistema operacional)
- **rh-prime** (sistema CLT)

Resultado: **ml-gestao-integral** (sistema unificado)

---

## Pré-requisitos

```bash
# Clone os 3 repositórios lado a lado
cd ~/projects/
git clone https://github.com/JohnGomes84/gestao-operacional.git
git clone https://github.com/JohnGomes84/rh-prime.git
git clone https://github.com/JohnGomes84/ml-gestao-integral.git
```

---

## Etapa 1: Estrutura de Pastas

### Criar diretórios base

```bash
cd ml-gestao-integral

# Client
mkdir -p client/src/{pages,components,lib,hooks}
mkdir -p client/src/pages/{dashboard,operational,clt,financial,compliance}
mkdir -p client/src/pages/operational/{operations,workers,clients,locations,shifts,reports,leader}
mkdir -p client/src/pages/clt/{employees,vacations,payroll,health,documents}
mkdir -p client/src/pages/financial/{payments,invoicing,profitability}
mkdir -p client/src/pages/compliance/{risks,autonomy,audit}

# Server
mkdir -p server/{_core,db,routes,functions,middleware}
mkdir -p server/functions/{operational,clt,financial,compliance}
mkdir -p server/routes

# Shared
mkdir -p shared/types

# Drizzle
mkdir -p drizzle/migrations
```

---

## Etapa 2: Copiar Arquivos Base

### De gestao-operacional (base do sistema)

```bash
# Configurações
cp ../gestao-operacional/tsconfig.json ./
cp ../gestao-operacional/vite.config.ts ./
cp ../gestao-operacional/vitest.config.ts ./
cp ../gestao-operacional/drizzle.config.ts ./
cp ../gestao-operacional/components.json ./
cp ../gestao-operacional/.prettierrc ./
cp ../gestao-operacional/.prettierignore ./

# Client base
cp -r ../gestao-operacional/client/src/components/* ./client/src/components/
cp -r ../gestao-operacional/client/src/lib/* ./client/src/lib/
cp -r ../gestao-operacional/client/src/hooks/* ./client/src/hooks/
cp ../gestao-operacional/client/src/main.tsx ./client/src/
cp ../gestao-operacional/client/src/App.tsx ./client/src/
cp ../gestao-operacional/client/index.html ./client/

# Server base
cp -r ../gestao-operacional/server/_core/* ./server/_core/
cp ../gestao-operacional/server/middleware/* ./server/middleware/
```

---

## Etapa 3: Módulo Operacional (gestao-operacional)

### Backend

```bash
# Schema operacional (vai ser mesclado depois)
cp ../gestao-operacional/server/db/schema.ts ./server/db/schema-operational.ts

# Funções operacionais
cp ../gestao-operacional/server/functions/operations.ts ./server/functions/operational/
cp ../gestao-operacional/server/functions/workers.ts ./server/functions/operational/
cp ../gestao-operacional/server/functions/clients.ts ./server/functions/operational/
cp ../gestao-operacional/server/functions/locations.ts ./server/functions/operational/
cp ../gestao-operacional/server/functions/shifts.ts ./server/functions/operational/
cp ../gestao-operacional/server/functions/contracts.ts ./server/functions/operational/
cp ../gestao-operacional/server/functions/workerRefusals.ts ./server/functions/compliance/
cp ../gestao-operacional/server/functions/workerAutonomy.ts ./server/functions/compliance/

# Rotas tRPC
cp ../gestao-operacional/server/routes/operations.ts ./server/routes/
cp ../gestao-operacional/server/routes/workers.ts ./server/routes/
cp ../gestao-operacional/server/routes/clients.ts ./server/routes/
cp ../gestao-operacional/server/routes/locations.ts ./server/routes/
cp ../gestao-operacional/server/routes/shifts.ts ./server/routes/
cp ../gestao-operacional/server/routes/contracts.ts ./server/routes/
cp ../gestao-operacional/server/routes/workerRegistration.ts ./server/routes/
```

### Frontend

```bash
# Páginas operacionais
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

---

## Etapa 4: Módulo CLT (rh-prime)

### Backend

```bash
# Schema CLT (vai ser mesclado depois)
cp ../rh-prime/server/db/schema.ts ./server/db/schema-clt.ts

# Funções CLT
cp ../rh-prime/server/functions/employees.ts ./server/functions/clt/
cp ../rh-prime/server/functions/vacations.ts ./server/functions/clt/
cp ../rh-prime/server/functions/payroll.ts ./server/functions/clt/
cp ../rh-prime/server/functions/healthDocuments.ts ./server/functions/clt/
cp ../rh-prime/server/functions/documents.ts ./server/functions/clt/
cp ../rh-prime/server/functions/digitalSignatures.ts ./server/functions/clt/
cp ../rh-prime/server/functions/auditLogs.ts ./server/functions/compliance/

# Rotas tRPC
cp ../rh-prime/server/routes/employees.ts ./server/routes/
cp ../rh-prime/server/routes/vacations.ts ./server/routes/
cp ../rh-prime/server/routes/payroll.ts ./server/routes/
cp ../rh-prime/server/routes/healthDocuments.ts ./server/routes/
cp ../rh-prime/server/routes/documents.ts ./server/routes/
cp ../rh-prime/server/routes/digitalSignatures.ts ./server/routes/
cp ../rh-prime/server/routes/auditLogs.ts ./server/routes/
```

### Frontend

```bash
# Páginas CLT (somente as FUNCIONAIS)
cp -r ../rh-prime/client/src/pages/employees/* ./client/src/pages/clt/employees/
cp -r ../rh-prime/client/src/pages/vacations/* ./client/src/pages/clt/vacations/
cp -r ../rh-prime/client/src/pages/health/* ./client/src/pages/clt/health/
cp -r ../rh-prime/client/src/pages/documents/* ./client/src/pages/clt/documents/

# Folha (schemas existem, criar UI nova)
mkdir -p ./client/src/pages/clt/payroll
# Implementar UI de folha do zero (20 créditos)

# NÃO COPIAR (UI órfã):
# - recruitment (0% funcional)
# - timeTracking (0% funcional)
# - assessments (0% funcional)
```

---

## Etapa 5: Schema Unificado

Criar `server/db/schema.ts` mesclando os dois:

```typescript
// server/db/schema.ts
import { mysqlTable, varchar, text, int, decimal, boolean, timestamp, json, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================
// CORE: Usuários e Autenticação
// ============================================

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  cpf: varchar('cpf', { length: 11 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('worker'),
  // roles: admin, leader, worker, supervisor, employee
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// ============================================
// MÓDULO OPERACIONAL: Trabalhadores Não-CLT
// ============================================

export const workers = mysqlTable('workers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  cpf: varchar('cpf', { length: 11 }).notNull().unique(),
  dateOfBirth: timestamp('date_of_birth').notNull(),
  motherName: varchar('mother_name', { length: 255 }).notNull(),
  contractType: varchar('contract_type', { length: 20 }).notNull(),
  // contractType: diarista, MEI, freelancer
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  pixType: varchar('pix_type', { length: 20 }),
  pixKey: varchar('pix_key', { length: 255 }),
  documentType: varchar('document_type', { length: 10 }),
  documentUrl: text('document_url'),
  approvalStatus: varchar('approval_status', { length: 20 }).default('pending'),
  operationalStatus: varchar('operational_status', { length: 20 }).default('active'),
  isBlocked: boolean('is_blocked').default(false),
  blockReason: text('block_reason'),
  blockedAt: timestamp('blocked_at'),
  blockedBy: varchar('blocked_by', { length: 36 }),
  // Endereço
  street: varchar('street', { length: 255 }),
  number: varchar('number', { length: 20 }),
  complement: varchar('complement', { length: 100 }),
  neighborhood: varchar('neighborhood', { length: 100 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 9 }),
  // MEI específico
  cnpj: varchar('cnpj', { length: 14 }),
  companyName: varchar('company_name', { length: 255 }),
  meiAnnualRevenue: decimal('mei_annual_revenue', { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const clients = mysqlTable('clients', {
  id: varchar('id', { length: 36 }).primaryKey(),
  cnpj: varchar('cnpj', { length: 14 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  // Endereço
  street: varchar('street', { length: 255 }),
  number: varchar('number', { length: 20 }),
  complement: varchar('complement', { length: 100 }),
  neighborhood: varchar('neighborhood', { length: 100 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 9 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const locations = mysqlTable('locations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  clientId: varchar('client_id', { length: 36 }).notNull().references(() => clients.id),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const shifts = mysqlTable('shifts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  clientId: varchar('client_id', { length: 36 }).notNull().references(() => clients.id),
  name: varchar('name', { length: 100 }).notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const operations = mysqlTable('operations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  clientId: varchar('client_id', { length: 36 }).notNull().references(() => clients.id),
  locationId: varchar('location_id', { length: 36 }).notNull().references(() => locations.id),
  shiftId: varchar('shift_id', { length: 36 }).notNull().references(() => shifts.id),
  leaderId: varchar('leader_id', { length: 36 }).notNull().references(() => users.id),
  scheduledDate: timestamp('scheduled_date').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  acceptedAt: timestamp('accepted_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const operationMembers = mysqlTable('operation_members', {
  id: varchar('id', { length: 36 }).primaryKey(),
  operationId: varchar('operation_id', { length: 36 }).notNull().references(() => operations.id, { onDelete: 'cascade' }),
  workerId: varchar('worker_id', { length: 36 }).notNull().references(() => workers.id),
  role: varchar('role', { length: 100 }).notNull(),
  dailyRate: decimal('daily_rate', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  acceptedAt: timestamp('accepted_at'),
  checkInAt: timestamp('check_in_at'),
  checkInLatitude: decimal('check_in_latitude', { precision: 10, scale: 8 }),
  checkInLongitude: decimal('check_in_longitude', { precision: 11, scale: 8 }),
  checkOutAt: timestamp('check_out_at'),
  mealConsumed: boolean('meal_consumed').default(false),
  epiUsed: boolean('epi_used').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Compliance operacional
export const workerRefusals = mysqlTable('worker_refusals', {
  id: varchar('id', { length: 36 }).primaryKey(),
  workerId: varchar('worker_id', { length: 36 }).notNull().references(() => workers.id),
  operationId: varchar('operation_id', { length: 36 }).references(() => operations.id),
  refusedAt: timestamp('refused_at').notNull(),
  reason: text('reason'),
  registeredBy: varchar('registered_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workerAutonomyMetrics = mysqlTable('worker_autonomy_metrics', {
  id: varchar('id', { length: 36 }).primaryKey(),
  workerId: varchar('worker_id', { length: 36 }).notNull().references(() => workers.id).unique(),
  totalOperations: int('total_operations').default(0),
  totalRefusals: int('total_refusals').default(0),
  uniqueClients: int('unique_clients').default(0),
  uniqueLocations: int('unique_locations').default(0),
  autonomyScore: int('autonomy_score').default(0),
  isHighRisk: boolean('is_high_risk').default(false),
  lastCalculatedAt: timestamp('last_calculated_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ============================================
// MÓDULO CLT: Funcionários com Vínculo
// ============================================

export const employees = mysqlTable('employees', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  cpf: varchar('cpf', { length: 11 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  hireDate: timestamp('hire_date').notNull(),
  terminationDate: timestamp('termination_date'),
  jobTitle: varchar('job_title', { length: 100 }).notNull(),
  department: varchar('department', { length: 100 }),
  monthlySalary: decimal('monthly_salary', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  managerId: varchar('manager_id', { length: 36 }).references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const vacations = mysqlTable('vacations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 36 }).notNull().references(() => employees.id),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  days: int('days').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  approvedBy: varchar('approved_by', { length: 36 }).references(() => users.id),
  approvedAt: timestamp('approved_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payroll = mysqlTable('payroll', {
  id: varchar('id', { length: 36 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 36 }).notNull().references(() => employees.id),
  referenceMonth: timestamp('reference_month').notNull(),
  grossSalary: decimal('gross_salary', { precision: 10, scale: 2 }).notNull(),
  inss: decimal('inss', { precision: 10, scale: 2 }).notNull(),
  ir: decimal('ir', { precision: 10, scale: 2 }).notNull(),
  otherDeductions: decimal('other_deductions', { precision: 10, scale: 2 }).default('0.00'),
  netSalary: decimal('net_salary', { precision: 10, scale: 2 }).notNull(),
  fgts: decimal('fgts', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const healthDocuments = mysqlTable('health_documents', {
  id: varchar('id', { length: 36 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 36 }).notNull().references(() => employees.id),
  documentType: varchar('document_type', { length: 20 }).notNull(),
  // ASO, PGR, PCMSO
  issueDate: timestamp('issue_date').notNull(),
  expiryDate: timestamp('expiry_date'),
  documentUrl: text('document_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// COMPLIANCE & AUDITORIA (Ambos os sistemas)
// ============================================

export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 36 }).notNull(),
  cpf: varchar('cpf', { length: 11 }).notNull(),
  action: varchar('action', { length: 20 }).notNull(),
  beforeData: json('before_data'),
  afterData: json('after_data'),
  actorId: varchar('actor_id', { length: 36 }).notNull().references(() => users.id),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  cpfIdx: index('idx_cpf').on(table.cpf),
  entityIdx: index('idx_entity').on(table.entityType, table.entityId),
}));

export const digitalSignatures = mysqlTable('digital_signatures', {
  id: varchar('id', { length: 36 }).primaryKey(),
  documentId: varchar('document_id', { length: 36 }).notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  cpf: varchar('cpf', { length: 11 }).notNull(),
  signatureHash: text('signature_hash').notNull(),
  signatureMethod: varchar('signature_method', { length: 20 }).notNull(),
  signedAt: timestamp('signed_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relações (Drizzle ORM)
export const usersRelations = relations(users, ({ many }) => ({
  workers: many(workers),
  employees: many(employees),
  operations: many(operations),
}));

export const workersRelations = relations(workers, ({ one, many }) => ({
  user: one(users, { fields: [workers.userId], references: [users.id] }),
  operationMembers: many(operationMembers),
  refusals: many(workerRefusals),
  autonomyMetrics: one(workerAutonomyMetrics, { fields: [workers.id], references: [workerAutonomyMetrics.workerId] }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  manager: one(employees, { fields: [employees.managerId], references: [employees.id] }),
  subordinates: many(employees),
  vacations: many(vacations),
  payrolls: many(payroll),
  healthDocuments: many(healthDocuments),
}));
```

Este schema será criado em `server/db/schema.ts`.

---

## Etapa 6: Instalar Dependências

```bash
cd ml-gestao-integral
pnpm install
```

---

## Etapa 7: Configurar .env

```bash
cp .env.example .env
```

Editar `.env`:

```env
DATABASE_URL=mysql://root:password@localhost:3306/ml_gestao_integral
JWT_SECRET=your-super-secret-key-change-in-production
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=ml-gestao-documents
```

---

## Etapa 8: Executar Migrations

```bash
pnpm db:push
```

Isso criará todas as tabelas no banco MySQL.

---

## Etapa 9: Ajustar Imports

### Problema comum: imports quebrados

Depois de copiar arquivos, imports como:

```typescript
// Antes (gestao-operacional)
import { workers } from '../db/schema';

// Depois (ml-gestao-integral)
import { workers } from '../../db/schema';  // Pode quebrar
```

### Solução: usar alias do TypeScript

Já configurado no `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/server/*": ["./server/*"],
      "@/client/*": ["./client/src/*"],
      "@/shared/*": ["./shared/*"]
    }
  }
}
```

Agora pode usar:

```typescript
import { workers } from '@/server/db/schema';
```

---

## Etapa 10: Atualizar Rotas no App.tsx

```typescript
// client/src/App.tsx
import { Route, Switch } from 'wouter';

function App() {
  return (
    <Switch>
      {/* Dashboard */}
      <Route path="/" component={Dashboard} />
      
      {/* Operacional */}
      <Route path="/operacoes" component={Operations} />
      <Route path="/trabalhadores" component={Workers} />
      <Route path="/clientes" component={Clients} />
      <Route path="/lider/operacao/:id" component={LeaderOperation} />
      
      {/* CLT */}
      <Route path="/funcionarios-clt" component={Employees} />
      <Route path="/ferias-clt" component={Vacations} />
      <Route path="/folha-pagamento" component={Payroll} />
      <Route path="/saude-seguranca" component={Health} />
      
      {/* Financeiro */}
      <Route path="/pagamentos" component={Payments} />
      <Route path="/faturamento" component={Invoicing} />
      
      {/* Compliance */}
      <Route path="/riscos" component={Risks} />
      <Route path="/autonomia" component={Autonomy} />
      <Route path="/auditoria" component={Audit} />
    </Switch>
  );
}
```

---

## Etapa 11: Testar

```bash
pnpm dev
```

Acesse: http://localhost:5000

### Checklist de testes:

- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Operações: criar, listar, aceitar
- [ ] Trabalhadores: cadastrar, aprovar
- [ ] Funcionários CLT: criar, listar
- [ ] Férias CLT: solicitar, aprovar
- [ ] Folha de pagamento: calcular
- [ ] Relatórios: gerar Excel

---

## Etapa 12: Resolver Conflitos Comuns

### 1. Types duplicados

**Problema:** `Worker` e `Employee` podem ter campos similares.

**Solução:** Criar tipos unificados em `shared/types/`:

```typescript
// shared/types/worker.ts
export type WorkerType = 'diarista' | 'MEI' | 'freelancer';
export type EmployeeType = 'CLT';
export type ContractType = WorkerType | EmployeeType;

export interface BaseWorker {
  id: string;
  cpf: string;
  name: string;
  contractType: ContractType;
}

export interface OperationalWorker extends BaseWorker {
  contractType: WorkerType;
  pixKey: string;
  operationalStatus: 'active' | 'inactive' | 'blocked';
}

export interface CLTEmployee extends BaseWorker {
  contractType: 'CLT';
  hireDate: Date;
  monthlySalary: number;
  status: 'active' | 'terminated';
}
```

### 2. Autenticação duplicada

**Problema:** Os dois sistemas têm auth separado.

**Solução:** Usar o auth do gestao-operacional (mais recente).

```bash
# Já copiado na Etapa 2
cp ../gestao-operacional/server/middleware/auth.ts ./server/middleware/
```

### 3. Dashboard duplicado

**Problema:** Dois dashboards diferentes.

**Solução:** Criar dashboard unificado (20 créditos, Fase 5 do roadmap).

---

## Próximos Passos

Após completar esta fusão:

1. **Completar folha de pagamento** (UI faltando, backend existe)
2. **Dashboard unificado** (cards operacionais + CLT + financeiro)
3. **Módulo financeiro** (pagamentos consolidados)
4. **Dashboard de riscos** (compliance)

---

## Suporte

Problemas na fusão? Verifique:

1. Imports estão corretos? (use `@/server`, `@/client`)
2. Migrations rodaram? (`pnpm db:push`)
3. .env configurado? (DATABASE_URL, JWT_SECRET)
4. Dependências instaladas? (`pnpm install`)

Se persistir, abra issue com:
- Erro exato
- Arquivo que deu erro
- Stack trace completa
