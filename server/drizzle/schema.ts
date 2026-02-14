// ============================================================================
// DRIZZLE SCHEMA - Definições de Tabelas MySQL
// ============================================================================

import { mysqlTable, varchar, text, int, decimal, datetime, boolean, timestamp, mysqlEnum, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// USERS (Sistema de Autenticação)
// ============================================================================

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  openId: varchar('open_id', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  loginMethod: varchar('login_method', { length: 50 }),
  role: mysqlEnum('role', ['admin', 'manager', 'user', 'viewer']).default('user'),
  lastSignedIn: datetime('last_signed_in'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ============================================================================
// WORKERS (Trabalhadores Autônomos - Gestão Operacional)
// ============================================================================

export const workers = mysqlTable('workers', {
  id: int('id').primaryKey().autoincrement(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  cpf: varchar('cpf', { length: 14 }).notNull().unique(),
  dateOfBirth: datetime('date_of_birth'),
  motherName: varchar('mother_name', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  street: varchar('street', { length: 255 }),
  number: varchar('number', { length: 20 }),
  complement: varchar('complement', { length: 100 }),
  neighborhood: varchar('neighborhood', { length: 100 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 10 }),
  pixKey: varchar('pix_key', { length: 255 }),
  pixKeyType: mysqlEnum('pix_key_type', ['cpf', 'cnpj', 'email', 'phone', 'random']),
  documentPhotoUrl: text('document_photo_url'),
  documentType: mysqlEnum('document_type', ['rg', 'cnh', 'rne']),
  workerType: mysqlEnum('worker_type', ['daily', 'freelancer', 'mei', 'clt']),
  registrationStatus: mysqlEnum('registration_status', ['pending', 'approved', 'rejected']).default('pending'),
  status: mysqlEnum('status', ['active', 'inactive', 'blocked']).default('inactive'),
  approvedBy: int('approved_by'),
  approvedAt: datetime('approved_at'),
  rejectionReason: text('rejection_reason'),
  isBlocked: boolean('is_blocked').default(false),
  blockReason: text('block_reason'),
  blockedAt: datetime('blocked_at'),
  blockedBy: int('blocked_by'),
  blockType: mysqlEnum('block_type', ['temporary', 'permanent']),
  blockExpiresAt: datetime('block_expires_at'),
  riskScore: int('risk_score').default(0),
  riskLevel: mysqlEnum('risk_level', ['low', 'medium', 'high', 'critical']).default('low'),
  dailyRate: decimal('daily_rate', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  cpfIdx: index('cpf_idx').on(table.cpf),
  statusIdx: index('status_idx').on(table.status),
}));

export type InsertWorker = typeof workers.$inferInsert;
export type Worker = typeof workers.$inferSelect;

// ============================================================================
// CLIENTS (Clientes)
// ============================================================================

export const clients = mysqlTable('clients', {
  id: int('id').primaryKey().autoincrement(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  cnpj: varchar('cnpj', { length: 18 }).unique(),
  contactName: varchar('contact_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  street: varchar('street', { length: 255 }),
  number: varchar('number', { length: 20 }),
  complement: varchar('complement', { length: 100 }),
  neighborhood: varchar('neighborhood', { length: 100 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 10 }),
  status: mysqlEnum('status', ['active', 'inactive']).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertClient = typeof clients.$inferInsert;
export type Client = typeof clients.$inferSelect;

// ============================================================================
// WORK LOCATIONS (Locais de Trabalho)
// ============================================================================

export const workLocations = mysqlTable('work_locations', {
  id: int('id').primaryKey().autoincrement(),
  clientId: int('client_id').notNull(),
  locationName: varchar('location_name', { length: 255 }).notNull(),
  street: varchar('street', { length: 255 }),
  number: varchar('number', { length: 20 }),
  complement: varchar('complement', { length: 100 }),
  neighborhood: varchar('neighborhood', { length: 100 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 10 }),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertWorkLocation = typeof workLocations.$inferInsert;
export type WorkLocation = typeof workLocations.$inferSelect;

// ============================================================================
// SHIFTS (Turnos)
// ============================================================================

export const shifts = mysqlTable('shifts', {
  id: int('id').primaryKey().autoincrement(),
  clientId: int('client_id').notNull(),
  shiftName: varchar('shift_name', { length: 100 }).notNull(),
  startTime: varchar('start_time', { length: 5 }),
  endTime: varchar('end_time', { length: 5 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertShift = typeof shifts.$inferInsert;
export type Shift = typeof shifts.$inferSelect;

// ============================================================================
// CONTRACTS (Contratos)
// ============================================================================

export const contracts = mysqlTable('contracts', {
  id: int('id').primaryKey().autoincrement(),
  clientId: int('client_id'),
  employeeId: int('employee_id'),
  contractNumber: varchar('contract_number', { length: 50 }),
  startDate: datetime('start_date'),
  endDate: datetime('end_date'),
  value: decimal('value', { precision: 12, scale: 2 }),
  status: mysqlEnum('status', ['active', 'inactive', 'expired']).default('active'),
  hireDate: datetime('hire_date'),
  contractType: varchar('contract_type', { length: 50 }),
  weeklyWorkload: int('weekly_workload'),
  salary: decimal('salary', { precision: 10, scale: 2 }),
  position: varchar('position', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertContract = typeof contracts.$inferInsert;
export type Contract = typeof contracts.$inferSelect;

// ============================================================================
// ALLOCATIONS (Alocações de Trabalhadores)
// ============================================================================

export const allocations = mysqlTable('allocations', {
  id: int('id').primaryKey().autoincrement(),
  workerId: int('worker_id').notNull(),
  clientId: int('client_id').notNull(),
  locationId: int('location_id').notNull(),
  shiftId: int('shift_id'),
  workDate: datetime('work_date').notNull(),
  jobFunction: varchar('job_function', { length: 255 }),
  dailyRate: decimal('daily_rate', { precision: 10, scale: 2 }),
  tookMeal: boolean('took_meal'),
  mealCost: decimal('meal_cost', { precision: 10, scale: 2 }),
  netPay: decimal('net_pay', { precision: 10, scale: 2 }),
  status: mysqlEnum('status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).default('pending'),
  checkInTime: datetime('check_in_time'),
  checkOutTime: datetime('check_out_time'),
  consecutiveDays: int('consecutive_days').default(0),
  daysThisMonth: int('days_this_month').default(0),
  riskFlag: boolean('risk_flag').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  workerIdx: index('worker_idx').on(table.workerId),
  clientIdx: index('client_idx').on(table.clientId),
  dateIdx: index('date_idx').on(table.workDate),
}));

export type InsertAllocation = typeof allocations.$inferInsert;
export type Allocation = typeof allocations.$inferSelect;

// ============================================================================
// OPERATIONS (Operações de Trabalho)
// ============================================================================

export const operations = mysqlTable('operations', {
  id: int('id').primaryKey().autoincrement(),
  clientId: int('client_id').notNull(),
  locationId: int('location_id').notNull(),
  contractId: int('contract_id'),
  shiftId: int('shift_id').notNull(),
  leaderId: int('leader_id').notNull(),
  createdBy: int('created_by').notNull(),
  operationName: varchar('operation_name', { length: 255 }).notNull(),
  workDate: datetime('work_date').notNull(),
  description: text('description'),
  status: mysqlEnum('status', ['created', 'in_progress', 'completed', 'cancelled']).default('created'),
  totalWorkers: int('total_workers').default(0),
  startedAt: datetime('started_at'),
  completedAt: datetime('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertOperation = typeof operations.$inferInsert;
export type Operation = typeof operations.$inferSelect;

// ============================================================================
// OPERATION MEMBERS (Membros de Operação)
// ============================================================================

export const operationMembers = mysqlTable('operation_members', {
  id: int('id').primaryKey().autoincrement(),
  operationId: int('operation_id').notNull(),
  workerId: int('worker_id').notNull(),
  jobFunction: varchar('job_function', { length: 255 }).notNull(),
  dailyRate: decimal('daily_rate', { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['invited', 'accepted', 'present', 'completed', 'absent']).default('invited'),
  acceptedAt: datetime('accepted_at'),
  checkInTime: datetime('check_in_time'),
  checkOutTime: datetime('check_out_time'),
  tookMeal: boolean('took_meal'),
  usedEpi: boolean('used_epi'),
  notes: text('notes'),
  acceptanceIp: varchar('acceptance_ip', { length: 50 }),
  cpfConfirmed: boolean('cpf_confirmed').default(false),
  termAccepted: boolean('term_accepted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertOperationMember = typeof operationMembers.$inferInsert;
export type OperationMember = typeof operationMembers.$inferSelect;

// ============================================================================
// OPERATION INCIDENTS (Incidentes em Operações)
// ============================================================================

export const operationIncidents = mysqlTable('operation_incidents', {
  id: int('id').primaryKey().autoincrement(),
  operationId: int('operation_id').notNull(),
  memberId: int('member_id'),
  reportedBy: int('reported_by').notNull(),
  incidentType: mysqlEnum('incident_type', ['absence', 'late_arrival', 'early_departure', 'misconduct', 'accident', 'equipment_issue', 'quality_issue', 'other']).notNull(),
  severity: mysqlEnum('severity', ['low', 'medium', 'high', 'critical']).notNull(),
  description: text('description').notNull(),
  photos: text('photos'),
  status: mysqlEnum('status', ['reported', 'investigating', 'resolved']).default('reported'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertOperationIncident = typeof operationIncidents.$inferInsert;
export type OperationIncident = typeof operationIncidents.$inferSelect;

// ============================================================================
// WORKER REFUSALS (Recusas de Trabalho - Documentação de Autonomia)
// ============================================================================

export const workerRefusals = mysqlTable('worker_refusals', {
  id: int('id').primaryKey().autoincrement(),
  workerId: int('worker_id').notNull(),
  operationId: int('operation_id'),
  clientId: int('client_id'),
  refusalReason: text('refusal_reason').notNull(),
  refusalType: mysqlEnum('refusal_type', ['scheduling_conflict', 'distance', 'rate_too_low', 'personal_reasons', 'already_working', 'other']).notNull(),
  refusalDate: datetime('refusal_date').notNull(),
  evidence: text('evidence'),
  registeredBy: int('registered_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertWorkerRefusal = typeof workerRefusals.$inferInsert;
export type WorkerRefusal = typeof workerRefusals.$inferSelect;

// ============================================================================
// WORKER AUTONOMY METRICS (Métricas de Autonomia)
// ============================================================================

export const workerAutonomyMetrics = mysqlTable('worker_autonomy_metrics', {
  id: int('id').primaryKey().autoincrement(),
  workerId: int('worker_id').notNull().unique(),
  totalRefusals: int('total_refusals').default(0),
  uniqueClients: int('unique_clients').default(0),
  uniqueLocations: int('unique_locations').default(0),
  totalOperations: int('total_operations').default(0),
  firstOperationDate: datetime('first_operation_date'),
  lastOperationDate: datetime('last_operation_date'),
  autonomyScore: int('autonomy_score').default(0),
  lastCalculatedAt: datetime('last_calculated_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertWorkerAutonomyMetrics = typeof workerAutonomyMetrics.$inferInsert;
export type WorkerAutonomyMetrics = typeof workerAutonomyMetrics.$inferSelect;

// ============================================================================
// WORKER BLOCK HISTORY (Histórico de Bloqueios)
// ============================================================================

export const workerBlockHistory = mysqlTable('worker_block_history', {
  id: int('id').primaryKey().autoincrement(),
  workerId: int('worker_id').notNull(),
  actionBy: int('action_by').notNull(),
  action: mysqlEnum('action', ['blocked', 'unblocked']).notNull(),
  reason: text('reason').notNull(),
  blockType: mysqlEnum('block_type', ['temporary', 'permanent']),
  expiresAt: datetime('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertWorkerBlockHistory = typeof workerBlockHistory.$inferInsert;
export type WorkerBlockHistory = typeof workerBlockHistory.$inferSelect;

// ============================================================================
// PAYMENTS (Pagamentos)
// ============================================================================

export const payments = mysqlTable('payments', {
  id: int('id').primaryKey().autoincrement(),
  workerId: int('worker_id').notNull(),
  periodStart: datetime('period_start').notNull(),
  periodEnd: datetime('period_end').notNull(),
  totalDays: int('total_days').default(0),
  grossAmount: decimal('gross_amount', { precision: 10, scale: 2 }),
  deductions: decimal('deductions', { precision: 10, scale: 2 }),
  netAmount: decimal('net_amount', { precision: 10, scale: 2 }),
  status: mysqlEnum('status', ['pending', 'paid', 'cancelled']).default('pending'),
  paidAt: datetime('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertPayment = typeof payments.$inferInsert;
export type Payment = typeof payments.$inferSelect;

// ============================================================================
// WORK OFFERS (Ofertas de Trabalho)
// ============================================================================

export const workOffers = mysqlTable('work_offers', {
  id: int('id').primaryKey().autoincrement(),
  workerId: int('worker_id').notNull(),
  clientId: int('client_id').notNull(),
  locationId: int('location_id').notNull(),
  shiftId: int('shift_id'),
  workDate: datetime('work_date').notNull(),
  jobFunction: varchar('job_function', { length: 255 }),
  dailyRate: decimal('daily_rate', { precision: 10, scale: 2 }),
  response: mysqlEnum('response', ['pending', 'accepted', 'refused']).default('pending'),
  refusalReason: text('refusal_reason'),
  respondedAt: datetime('responded_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertWorkOffer = typeof workOffers.$inferInsert;
export type WorkOffer = typeof workOffers.$inferSelect;

// ============================================================================
// WORKER TERMS (Termos Aceitos por Trabalhadores)
// ============================================================================

export const workerTerms = mysqlTable('worker_terms', {
  id: int('id').primaryKey().autoincrement(),
  workerId: int('worker_id').notNull(),
  termType: varchar('term_type', { length: 100 }).notNull(),
  termVersion: varchar('term_version', { length: 50 }).notNull(),
  acceptedAt: datetime('accepted_at').notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertWorkerTerm = typeof workerTerms.$inferInsert;
export type WorkerTerm = typeof workerTerms.$inferSelect;

// ============================================================================
// INCIDENTS (Incidentes Gerais)
// ============================================================================

export const incidents = mysqlTable('incidents', {
  id: int('id').primaryKey().autoincrement(),
  workerId: int('worker_id'),
  clientId: int('client_id'),
  locationId: int('location_id'),
  incidentType: varchar('incident_type', { length: 100 }).notNull(),
  severity: mysqlEnum('severity', ['low', 'medium', 'high', 'critical']).notNull(),
  description: text('description').notNull(),
  reportedBy: int('reported_by').notNull(),
  status: mysqlEnum('status', ['open', 'investigating', 'resolved', 'closed']).default('open'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertIncident = typeof incidents.$inferInsert;
export type Incident = typeof incidents.$inferSelect;

// ============================================================================
// EVALUATIONS (Avaliações)
// ============================================================================

export const evaluations = mysqlTable('evaluations', {
  id: int('id').primaryKey().autoincrement(),
  allocationId: int('allocation_id').notNull(),
  workerId: int('worker_id').notNull(),
  evaluatorId: int('evaluator_id').notNull(),
  rating: int('rating').notNull(),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertEvaluation = typeof evaluations.$inferInsert;
export type Evaluation = typeof evaluations.$inferSelect;

// ============================================================================
// EPI RECORDS (Registros de EPIs)
// ============================================================================

export const epiRecords = mysqlTable('epi_records', {
  id: int('id').primaryKey().autoincrement(),
  workerId: int('worker_id').notNull(),
  epiType: varchar('epi_type', { length: 255 }).notNull(),
  deliveryDate: datetime('delivery_date').notNull(),
  expiryDate: datetime('expiry_date'),
  caNumber: varchar('ca_number', { length: 50 }),
  status: mysqlEnum('status', ['active', 'expired', 'returned']).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertEpiRecord = typeof epiRecords.$inferInsert;
export type EpiRecord = typeof epiRecords.$inferSelect;

// ============================================================================
// SHIFT CHECKLISTS (Checklists de Turno)
// ============================================================================

export const shiftChecklists = mysqlTable('shift_checklists', {
  id: int('id').primaryKey().autoincrement(),
  shiftId: int('shift_id').notNull(),
  itemDescription: varchar('item_description', { length: 255 }).notNull(),
  isCompleted: boolean('is_completed').default(false),
  completedBy: int('completed_by'),
  completedAt: datetime('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertShiftChecklist = typeof shiftChecklists.$inferInsert;
export type ShiftChecklist = typeof shiftChecklists.$inferSelect;

// ============================================================================
// PROCEDURES (Procedimentos)
// ============================================================================

export const procedures = mysqlTable('procedures', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 100 }),
  version: varchar('version', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertProcedure = typeof procedures.$inferInsert;
export type Procedure = typeof procedures.$inferSelect;

// ============================================================================
// PROCEDURE READ LOGS (Logs de Leitura de Procedimentos)
// ============================================================================

export const procedureReadLogs = mysqlTable('procedure_read_logs', {
  id: int('id').primaryKey().autoincrement(),
  procedureId: int('procedure_id').notNull(),
  userId: int('user_id').notNull(),
  readAt: datetime('read_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertProcedureReadLog = typeof procedureReadLogs.$inferInsert;
export type ProcedureReadLog = typeof procedureReadLogs.$inferSelect;

// ============================================================================
// EMPLOYEES (Funcionários CLT - RH Prime)
// ============================================================================

export const employees = mysqlTable('employees', {
  id: int('id').primaryKey().autoincrement(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  cpf: varchar('cpf', { length: 14 }).notNull().unique(),
  rg: varchar('rg', { length: 20 }),
  dateOfBirth: datetime('date_of_birth'),
  gender: mysqlEnum('gender', ['M', 'F', 'Other']),
  maritalStatus: varchar('marital_status', { length: 50 }),
  nationality: varchar('nationality', { length: 100 }),
  motherName: varchar('mother_name', { length: 255 }),
  fatherName: varchar('father_name', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  street: varchar('street', { length: 255 }),
  number: varchar('number', { length: 20 }),
  complement: varchar('complement', { length: 100 }),
  neighborhood: varchar('neighborhood', { length: 100 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 10 }),
  status: mysqlEnum('status', ['Ativo', 'Afastado', 'Férias', 'Demitido']).default('Ativo'),
  admissionDate: datetime('admission_date'),
  terminationDate: datetime('termination_date'),
  position: varchar('position', { length: 255 }),
  department: varchar('department', { length: 255 }),
  salary: decimal('salary', { precision: 10, scale: 2 }),
  bankName: varchar('bank_name', { length: 100 }),
  bankAgency: varchar('bank_agency', { length: 20 }),
  bankAccount: varchar('bank_account', { length: 30 }),
  pixKey: varchar('pix_key', { length: 255 }),
  emergencyContactName: varchar('emergency_contact_name', { length: 255 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  cpfIdx: index('employee_cpf_idx').on(table.cpf),
  statusIdx: index('employee_status_idx').on(table.status),
}));

export type InsertEmployee = typeof employees.$inferInsert;
export type Employee = typeof employees.$inferSelect;

// ============================================================================
// POSITIONS (Cargos)
// ============================================================================

export const positions = mysqlTable('positions', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  department: varchar('department', { length: 255 }),
  minSalary: decimal('min_salary', { precision: 10, scale: 2 }),
  maxSalary: decimal('max_salary', { precision: 10, scale: 2 }),
  requirements: text('requirements'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertPosition = typeof positions.$inferInsert;
export type Position = typeof positions.$inferSelect;

// ============================================================================
// EMPLOYEE POSITIONS (Histórico de Cargos de Funcionários)
// ============================================================================

export const employeePositions = mysqlTable('employee_positions', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  positionId: int('position_id').notNull(),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date'),
  salary: decimal('salary', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertEmployeePosition = typeof employeePositions.$inferInsert;
export type EmployeePosition = typeof employeePositions.$inferSelect;

// ============================================================================
// VACATIONS (Férias)
// ============================================================================

export const vacations = mysqlTable('vacations', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  acquisitionStart: datetime('acquisition_start').notNull(),
  acquisitionEnd: datetime('acquisition_end').notNull(),
  concessionLimit: datetime('concession_limit').notNull(),
  daysAvailable: int('days_available').default(30),
  status: mysqlEnum('status', ['Pendente', 'Em Gozo', 'Concluído', 'Vencido']).default('Pendente'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertVacation = typeof vacations.$inferInsert;
export type Vacation = typeof vacations.$inferSelect;

// ============================================================================
// VACATION PERIODS (Períodos de Férias)
// ============================================================================

export const vacationPeriods = mysqlTable('vacation_periods', {
  id: int('id').primaryKey().autoincrement(),
  vacationId: int('vacation_id').notNull(),
  employeeId: int('employee_id').notNull(),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date').notNull(),
  days: int('days').notNull(),
  status: mysqlEnum('status', ['Agendado', 'Em Gozo', 'Concluído', 'Cancelado']).default('Agendado'),
  abono: boolean('abono').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertVacationPeriod = typeof vacationPeriods.$inferInsert;
export type VacationPeriod = typeof vacationPeriods.$inferSelect;

// ============================================================================
// MEDICAL EXAMS (Exames Médicos)
// ============================================================================

export const medicalExams = mysqlTable('medical_exams', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  examType: mysqlEnum('exam_type', ['Admissional', 'Periódico', 'Retorno ao Trabalho', 'Mudança de Função', 'Demissional']).notNull(),
  examDate: datetime('exam_date').notNull(),
  expiryDate: datetime('expiry_date'),
  result: mysqlEnum('result', ['Apto', 'Inapto']),
  clinicName: varchar('clinic_name', { length: 255 }),
  doctorName: varchar('doctor_name', { length: 255 }),
  crmNumber: varchar('crm_number', { length: 20 }),
  status: mysqlEnum('status', ['Agendado', 'Realizado', 'Válido', 'Vencido']).default('Agendado'),
  observations: text('observations'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertMedicalExam = typeof medicalExams.$inferInsert;
export type MedicalExam = typeof medicalExams.$inferSelect;

// ============================================================================
// LEAVES (Afastamentos)
// ============================================================================

export const leaves = mysqlTable('leaves', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  leaveType: varchar('leave_type', { length: 100 }).notNull(),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date'),
  reason: text('reason'),
  status: mysqlEnum('status', ['Ativo', 'Encerrado']).default('Ativo'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertLeave = typeof leaves.$inferInsert;
export type Leave = typeof leaves.$inferSelect;

// ============================================================================
// TIME BANK (Banco de Horas)
// ============================================================================

export const timeBank = mysqlTable('time_bank', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  referenceMonth: varchar('reference_month', { length: 7 }).notNull(),
  hoursWorked: decimal('hours_worked', { precision: 5, scale: 2 }),
  hoursExpected: decimal('hours_expected', { precision: 5, scale: 2 }),
  balance: decimal('balance', { precision: 5, scale: 2 }),
  expiryDate: datetime('expiry_date'),
  status: mysqlEnum('status', ['Ativo', 'Expirado', 'Compensado']).default('Ativo'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertTimeBank = typeof timeBank.$inferInsert;
export type TimeBank = typeof timeBank.$inferSelect;

// ============================================================================
// BENEFITS (Benefícios)
// ============================================================================

export const benefits = mysqlTable('benefits', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  benefitType: varchar('benefit_type', { length: 100 }).notNull(),
  value: decimal('value', { precision: 10, scale: 2 }),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date'),
  status: mysqlEnum('status', ['Ativo', 'Cancelado', 'Suspenso']).default('Ativo'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertBenefit = typeof benefits.$inferInsert;
export type Benefit = typeof benefits.$inferSelect;

// ============================================================================
// DOCUMENTS (Documentos - GED)
// ============================================================================

export const documents = mysqlTable('documents', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id'),
  documentName: varchar('document_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 50 }),
  uploadedBy: int('uploaded_by').notNull(),
  uploadedAt: datetime('uploaded_at').notNull(),
  expiryDate: datetime('expiry_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertDocument = typeof documents.$inferInsert;
export type Document = typeof documents.$inferSelect;

// ============================================================================
// CHECKLIST ITEMS (Itens de Checklist)
// ============================================================================

export const checklistItems = mysqlTable('checklist_items', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  checklistType: varchar('checklist_type', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }),
  itemDescription: varchar('item_description', { length: 255 }).notNull(),
  isCompleted: boolean('is_completed').default(false),
  completedBy: int('completed_by'),
  completedAt: datetime('completed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertChecklistItem = typeof checklistItems.$inferInsert;
export type ChecklistItem = typeof checklistItems.$inferSelect;

// ============================================================================
// EQUIPMENT (Equipamentos)
// ============================================================================

export const equipment = mysqlTable('equipment', {
  id: int('id').primaryKey().autoincrement(),
  equipmentType: varchar('equipment_type', { length: 100 }).notNull(),
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }).unique(),
  patrimonyNumber: varchar('patrimony_number', { length: 100 }).unique(),
  status: mysqlEnum('status', ['Disponível', 'Em Uso', 'Manutenção', 'Inativo']).default('Disponível'),
  acquisitionDate: datetime('acquisition_date'),
  warrantyExpiry: datetime('warranty_expiry'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertEquipment = typeof equipment.$inferInsert;
export type Equipment = typeof equipment.$inferSelect;

// ============================================================================
// EQUIPMENT LOANS (Empréstimos de Equipamentos)
// ============================================================================

export const equipmentLoans = mysqlTable('equipment_loans', {
  id: int('id').primaryKey().autoincrement(),
  equipmentId: int('equipment_id').notNull(),
  employeeId: int('employee_id').notNull(),
  loanDate: datetime('loan_date').notNull(),
  expectedReturnDate: datetime('expected_return_date'),
  actualReturnDate: datetime('actual_return_date'),
  status: mysqlEnum('status', ['Ativo', 'Devolvido', 'Atrasado']).default('Ativo'),
  observations: text('observations'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertEquipmentLoan = typeof equipmentLoans.$inferInsert;
export type EquipmentLoan = typeof equipmentLoans.$inferSelect;

// ============================================================================
// PPE DELIVERIES (Entregas de EPIs)
// ============================================================================

export const ppeDeliveries = mysqlTable('ppe_deliveries', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  ppeType: varchar('ppe_type', { length: 255 }).notNull(),
  deliveryDate: datetime('delivery_date').notNull(),
  caNumber: varchar('ca_number', { length: 50 }),
  quantity: int('quantity').default(1),
  signatureUrl: text('signature_url'),
  expiryDate: datetime('expiry_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertPpeDelivery = typeof ppeDeliveries.$inferInsert;
export type PpeDelivery = typeof ppeDeliveries.$inferSelect;

// ============================================================================
// TRAININGS (Treinamentos)
// ============================================================================

export const trainings = mysqlTable('trainings', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  trainingName: varchar('training_name', { length: 255 }).notNull(),
  trainingDate: datetime('training_date').notNull(),
  instructor: varchar('instructor', { length: 255 }),
  duration: int('duration'),
  certificateUrl: text('certificate_url'),
  expiryDate: datetime('expiry_date'),
  status: mysqlEnum('status', ['Válido', 'Vencido']).default('Válido'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertTraining = typeof trainings.$inferInsert;
export type Training = typeof trainings.$inferSelect;

// ============================================================================
// SERVICE ORDERS (Ordens de Serviço)
// ============================================================================

export const serviceOrders = mysqlTable('service_orders', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  issueDate: datetime('issue_date').notNull(),
  description: text('description').notNull(),
  signatureUrl: text('signature_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertServiceOrder = typeof serviceOrders.$inferInsert;
export type ServiceOrder = typeof serviceOrders.$inferSelect;

// ============================================================================
// DOCUMENT TEMPLATES (Templates de Documentos)
// ============================================================================

export const documentTemplates = mysqlTable('document_templates', {
  id: int('id').primaryKey().autoincrement(),
  templateName: varchar('template_name', { length: 255 }).notNull(),
  templateType: varchar('template_type', { length: 100 }).notNull(),
  content: text('content').notNull(),
  isActive: boolean('is_active').default(true),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertDocumentTemplate = typeof documentTemplates.$inferInsert;
export type DocumentTemplate = typeof documentTemplates.$inferSelect;

// ============================================================================
// NOTIFICATIONS (Notificações)
// ============================================================================

export const notifications = mysqlTable('notifications', {
  id: int('id').primaryKey().autoincrement(),
  type: varchar('type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  priority: mysqlEnum('priority', ['low', 'medium', 'high', 'urgent']).default('medium'),
  isRead: boolean('is_read').default(false),
  readAt: datetime('read_at'),
  relatedModule: varchar('related_module', { length: 100 }),
  relatedId: int('related_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertNotification = typeof notifications.$inferInsert;
export type Notification = typeof notifications.$inferSelect;

// ============================================================================
// HOLIDAYS (Feriados)
// ============================================================================

export const holidays = mysqlTable('holidays', {
  id: int('id').primaryKey().autoincrement(),
  date: datetime('date').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['Nacional', 'Estadual', 'Municipal']).notNull(),
  state: varchar('state', { length: 2 }),
  city: varchar('city', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertHoliday = typeof holidays.$inferInsert;
export type Holiday = typeof holidays.$inferSelect;

// ============================================================================
// SETTINGS (Configurações do Sistema)
// ============================================================================

export const settings = mysqlTable('settings', {
  id: int('id').primaryKey().autoincrement(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertSetting = typeof settings.$inferInsert;
export type Setting = typeof settings.$inferSelect;

// ============================================================================
// AUDIT LOGS (Logs de Auditoria)
// ============================================================================

export const auditLogs = mysqlTable('audit_logs', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id'),
  action: varchar('action', { length: 50 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: int('resource_id'),
  cpf: varchar('cpf', { length: 255 }),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  timestamp: datetime('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;

// ============================================================================
// ABSENCES (Faltas)
// ============================================================================

export const absences = mysqlTable('absences', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  absenceDate: datetime('absence_date').notNull(),
  justified: boolean('justified').default(false),
  justification: text('justification'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type InsertAbsence = typeof absences.$inferInsert;
export type Absence = typeof absences.$inferSelect;

// ============================================================================
// DEPENDENTS (Dependentes)
// ============================================================================

export const dependents = mysqlTable('dependents', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  relationship: varchar('relationship', { length: 50 }).notNull(),
  cpf: varchar('cpf', { length: 14 }),
  dateOfBirth: datetime('date_of_birth').notNull(),
  irDependent: boolean('ir_dependent').default(false),
  healthPlanDependent: boolean('health_plan_dependent').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertDependent = typeof dependents.$inferInsert;
export type Dependent = typeof dependents.$inferSelect;

// ============================================================================
// PGR (Programa de Gerenciamento de Riscos)
// ============================================================================

export const pgr = mysqlTable('pgr', {
  id: int('id').primaryKey().autoincrement(),
  documentNumber: varchar('document_number', { length: 100 }).notNull(),
  issueDate: datetime('issue_date').notNull(),
  expiryDate: datetime('expiry_date').notNull(),
  status: mysqlEnum('status', ['Válido', 'Vencido']).default('Válido'),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertPGR = typeof pgr.$inferInsert;
export type PGR = typeof pgr.$inferSelect;

// ============================================================================
// PCMSO (Programa de Controle Médico de Saúde Ocupacional)
// ============================================================================

export const pcmso = mysqlTable('pcmso', {
  id: int('id').primaryKey().autoincrement(),
  documentNumber: varchar('document_number', { length: 100 }).notNull(),
  issueDate: datetime('issue_date').notNull(),
  expiryDate: datetime('expiry_date').notNull(),
  status: mysqlEnum('status', ['Válido', 'Vencido']).default('Válido'),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertPCMSO = typeof pcmso.$inferInsert;
export type PCMSO = typeof pcmso.$inferSelect;

// ============================================================================
// DASHBOARD SETTINGS (Configurações de Dashboard)
// ============================================================================

export const dashboardSettings = mysqlTable('dashboard_settings', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  widgetConfig: text('widget_config'),
  theme: varchar('theme', { length: 50 }).default('light'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type InsertDashboardSetting = typeof dashboardSettings.$inferInsert;
export type DashboardSetting = typeof dashboardSettings.$inferSelect;
