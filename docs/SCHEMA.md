# Schema Unificado - ML Gestão Integral

## Visão Geral

O schema unifica dois sistemas:
- **gestao-operacional** (workers, operations, compliance operacional)
- **rh-prime** (employees CLT, vacations, payroll, health)

---

## Diagrama ER

```
          users
            |
      ______|______
      |           |
    workers    employees (CLT)
      |           |
      |           |
  operations   vacations
      |        payroll
      |        healthDocuments
      |
operationMembers
workerRefusals
workerAutonomyMetrics


Compartilhado:
- auditLogs (todos)
- digitalSignatures (todos)
```

---

## Tabelas Core

### users
**Propósito:** Autenticação e autorização unificada

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'worker',
  -- roles: admin, leader, worker, supervisor, employee
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Roles:**
- `admin`: Acesso total
- `leader`: Líder de operações (check-in/out)
- `supervisor`: Supervisor CLT (hierarquia)
- `employee`: Funcionário CLT
- `worker`: Trabalhador operacional (diarista/MEI)

---

## Módulo Operacional

### workers
**Propósito:** Trabalhadores não-CLT (diaristas, MEI, freelancers)

```sql
CREATE TABLE workers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  date_of_birth TIMESTAMP NOT NULL,
  mother_name VARCHAR(255) NOT NULL,
  contract_type VARCHAR(20) NOT NULL,
  -- contract_type: diarista, MEI, freelancer
  
  -- Contato
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- Pagamento
  pix_type VARCHAR(20),
  pix_key VARCHAR(255),
  
  -- Documento
  document_type VARCHAR(10),  -- RG, CNH, RNE
  document_url TEXT,
  
  -- Status
  approval_status VARCHAR(20) DEFAULT 'pending',
  operational_status VARCHAR(20) DEFAULT 'active',
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  blocked_at TIMESTAMP,
  blocked_by VARCHAR(36),
  
  -- Endereço
  street VARCHAR(255),
  number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(9),
  
  -- MEI específico
  cnpj VARCHAR(14),
  company_name VARCHAR(255),
  mei_annual_revenue DECIMAL(10,2) DEFAULT 0.00,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_cpf (cpf),
  INDEX idx_contract_type (contract_type),
  INDEX idx_approval (approval_status),
  INDEX idx_blocked (is_blocked)
);
```

### operations
**Propósito:** Missões operacionais com equipe

```sql
CREATE TABLE operations (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL REFERENCES clients(id),
  location_id VARCHAR(36) NOT NULL REFERENCES locations(id),
  shift_id VARCHAR(36) NOT NULL REFERENCES shifts(id),
  leader_id VARCHAR(36) NOT NULL REFERENCES users(id),
  scheduled_date TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- status: pending, accepted, in_progress, completed, cancelled
  accepted_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_status (status),
  INDEX idx_leader (leader_id),
  INDEX idx_date (scheduled_date)
);
```

### operationMembers
**Propósito:** Trabalhadores alocados em cada operação

```sql
CREATE TABLE operation_members (
  id VARCHAR(36) PRIMARY KEY,
  operation_id VARCHAR(36) NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
  worker_id VARCHAR(36) NOT NULL REFERENCES workers(id),
  role VARCHAR(100) NOT NULL,  -- Função na operação
  daily_rate DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- status: pending, accepted, checked_in, checked_out, absent
  accepted_at TIMESTAMP,
  check_in_at TIMESTAMP,
  check_in_latitude DECIMAL(10,8),
  check_in_longitude DECIMAL(11,8),
  check_out_at TIMESTAMP,
  meal_consumed BOOLEAN DEFAULT false,
  epi_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_operation (operation_id),
  INDEX idx_worker (worker_id),
  INDEX idx_status (status)
);
```

### workerRefusals
**Propósito:** Registro de recusas (prova de autonomia)

```sql
CREATE TABLE worker_refusals (
  id VARCHAR(36) PRIMARY KEY,
  worker_id VARCHAR(36) NOT NULL REFERENCES workers(id),
  operation_id VARCHAR(36) REFERENCES operations(id),
  refused_at TIMESTAMP NOT NULL,
  reason TEXT,
  registered_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_worker (worker_id)
);
```

### workerAutonomyMetrics
**Propósito:** Score de autonomia (compliance trabalhista)

```sql
CREATE TABLE worker_autonomy_metrics (
  id VARCHAR(36) PRIMARY KEY,
  worker_id VARCHAR(36) UNIQUE NOT NULL REFERENCES workers(id),
  total_operations INT DEFAULT 0,
  total_refusals INT DEFAULT 0,
  unique_clients INT DEFAULT 0,
  unique_locations INT DEFAULT 0,
  autonomy_score INT DEFAULT 0,  -- 0-100
  is_high_risk BOOLEAN DEFAULT false,
  last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_score (autonomy_score),
  INDEX idx_risk (is_high_risk)
);
```

---

## Módulo CLT

### employees
**Propósito:** Funcionários com vínculo CLT

```sql
CREATE TABLE employees (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  hire_date TIMESTAMP NOT NULL,
  termination_date TIMESTAMP,
  job_title VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  monthly_salary DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  manager_id VARCHAR(36) REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_cpf (cpf),
  INDEX idx_status (status),
  INDEX idx_manager (manager_id)
);
```

### vacations
**Propósito:** Férias de funcionários CLT

```sql
CREATE TABLE vacations (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL REFERENCES employees(id),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  days INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- status: pending, approved, rejected, taken
  approved_by VARCHAR(36) REFERENCES users(id),
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_employee (employee_id),
  INDEX idx_status (status)
);
```

### payroll
**Propósito:** Folha de pagamento mensal CLT

```sql
CREATE TABLE payroll (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL REFERENCES employees(id),
  reference_month TIMESTAMP NOT NULL,
  gross_salary DECIMAL(10,2) NOT NULL,
  inss DECIMAL(10,2) NOT NULL,
  ir DECIMAL(10,2) NOT NULL,
  other_deductions DECIMAL(10,2) DEFAULT 0.00,
  net_salary DECIMAL(10,2) NOT NULL,
  fgts DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_employee (employee_id),
  INDEX idx_month (reference_month),
  INDEX idx_status (status)
);
```

### healthDocuments
**Propósito:** ASO, PGR, PCMSO (saúde ocupacional)

```sql
CREATE TABLE health_documents (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL REFERENCES employees(id),
  document_type VARCHAR(20) NOT NULL,
  -- document_type: ASO, PGR, PCMSO
  issue_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_employee (employee_id),
  INDEX idx_type (document_type),
  INDEX idx_expiry (expiry_date)
);
```

---

## Módulo Compliance (Compartilhado)

### auditLogs
**Propósito:** Log de todas as ações (rastreabilidade)

```sql
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  cpf VARCHAR(11) NOT NULL,
  action VARCHAR(20) NOT NULL,
  -- action: create, update, delete, view
  before_data JSON,
  after_data JSON,
  actor_id VARCHAR(36) NOT NULL REFERENCES users(id),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_cpf (cpf),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_actor (actor_id)
);
```

### digitalSignatures
**Propósito:** Assinaturas digitais Gov.br

```sql
CREATE TABLE digital_signatures (
  id VARCHAR(36) PRIMARY KEY,
  document_id VARCHAR(36) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  cpf VARCHAR(11) NOT NULL,
  signature_hash TEXT NOT NULL,
  signature_method VARCHAR(20) NOT NULL,
  -- signature_method: PIN, biometria, govbr
  signed_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_cpf (cpf),
  INDEX idx_document (document_type, document_id)
);
```

---

## Diferenças entre Workers e Employees

| Campo | workers (diarista/MEI) | employees (CLT) |
|-------|------------------------|------------------|
| **Vínculo** | Autônomo, sem vínculo | Vínculo empregatício |
| **Pagamento** | Por diária/operação | Mensal (folha) |
| **Compliance** | Bloqueio por continuidade | Férias, FGTS, INSS |
| **Documento** | CPF + PIX | CPF + cartão ponto |
| **Horas** | Check-in/out sem jornada | Controle de jornada CLT |
| **Benefícios** | Marmita, EPI (custo) | Vale, plano, 13º |
| **Risco Legal** | Vínculo empregatício | Passivo trabalhista |

---

## Migrations

Após criar `server/db/schema.ts`, executar:

```bash
pnpm db:push
```

Isso gera e aplica migrations automaticamente via Drizzle Kit.

---

## Queries Comuns

### 1. Listar trabalhadores bloqueados

```sql
SELECT 
  w.name,
  w.cpf,
  w.block_reason,
  w.blocked_at
FROM workers w
WHERE w.is_blocked = true
ORDER BY w.blocked_at DESC;
```

### 2. Calcular dias consecutivos de trabalho

```sql
SELECT 
  w.name,
  COUNT(DISTINCT o.scheduled_date) as dias_consecutivos
FROM workers w
JOIN operation_members om ON om.worker_id = w.id
JOIN operations o ON o.id = om.operation_id
WHERE om.status = 'checked_out'
  AND o.scheduled_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY w.id
HAVING dias_consecutivos >= 3;
```

### 3. Férias CLT vencidas

```sql
SELECT 
  e.name,
  e.hire_date,
  DATEDIFF(NOW(), e.hire_date) / 365 as anos_trabalhados,
  COALESCE(SUM(v.days), 0) as dias_de_ferias_tirados,
  (DATEDIFF(NOW(), e.hire_date) / 365) * 30 - COALESCE(SUM(v.days), 0) as saldo_ferias
FROM employees e
LEFT JOIN vacations v ON v.employee_id = e.id AND v.status = 'taken'
WHERE e.status = 'active'
GROUP BY e.id
HAVING saldo_ferias > 30;  -- Mais de 30 dias acumulados
```

---

## Indexes Críticos

Já criados no schema:

- `workers.cpf` (busca rápida)
- `workers.is_blocked` (filtrar bloqueados)
- `operations.status` (operações ativas)
- `operations.scheduled_date` (filtro por período)
- `audit_logs.cpf` (rastreabilidade)
- `employees.cpf` (busca CLT)
- `vacations.employee_id` (férias por funcionário)

---

## Próximos Passos

1. Executar migrations
2. Popular dados de teste
3. Testar queries críticas
4. Documentar procedures (se necessário)
