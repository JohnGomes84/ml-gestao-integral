// @ts-nocheck
// ============================================================================
// SCHEMA UNIFICADO - ML GESTÃO INTEGRAL
// Mescla: gestao-operacional (db.ts) + rh-prime (db-clt.ts)
// ============================================================================

import {
  eq,
  and,
  gte,
  lte,
  lt,
  desc,
  asc,
  sql,
  count,
  or,
  isNotNull,
  like,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import {
  // Users (comum aos dois sistemas)
  InsertUser,
  users,

  // ===== GESTÃO OPERACIONAL (db.ts) =====
  workers,
  InsertWorker,
  Worker,
  clients,
  InsertClient,
  contracts,
  InsertContract,
  shifts,
  InsertShift,
  workLocations,
  InsertWorkLocation,
  allocations,
  InsertAllocation,
  workOffers,
  InsertWorkOffer,
  workerTerms,
  InsertWorkerTerm,
  shiftChecklists,
  InsertShiftChecklist,
  epiRecords,
  InsertEpiRecord,
  incidents,
  InsertIncident,
  payments,
  InsertPayment,
  evaluations,
  InsertEvaluation,
  procedures,
  InsertProcedure,
  procedureReadLogs,
  InsertProcedureReadLog,
  operations,
  InsertOperation,
  operationMembers,
  InsertOperationMember,
  operationIncidents,
  InsertOperationIncident,
  workerBlockHistory,
  workerRefusals,
  InsertWorkerRefusal,
  workerAutonomyMetrics,
  InsertWorkerAutonomyMetrics,

  // ===== RH PRIME (db-clt.ts) =====
  employees,
  InsertEmployee,
  positions,
  InsertPosition,
  // contracts já está no gestão-operacional - reuso
  employeePositions,
  InsertEmployeePosition,
  vacations,
  InsertVacation,
  vacationPeriods,
  InsertVacationPeriod,
  medicalExams,
  InsertMedicalExam,
  leaves,
  InsertLeave,
  timeBank,
  InsertTimeBank,
  benefits,
  InsertBenefit,
  documents,
  InsertDocument,
  checklistItems,
  InsertChecklistItem,
  equipment,
  InsertEquipment,
  equipmentLoans,
  InsertEquipmentLoan,
  ppeDeliveries,
  InsertPpeDelivery,
  trainings,
  InsertTraining,
  serviceOrders,
  InsertServiceOrder,
  documentTemplates,
  InsertDocumentTemplate,
  notifications,
  InsertNotification,
  holidays,
  InsertHoliday,
  settings,
  InsertSetting,
  auditLogs,
  InsertAuditLog,
  absences,
  InsertAbsence,
  dependents,
  InsertDependent,
  pgr,
  InsertPGR,
  pcmso,
  InsertPCMSO,
  dashboardSettings,
  InsertDashboardSetting,
} from "../drizzle/schema";

import { ENV } from "../_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USERS (Comum aos dois sistemas)
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// MÓDULO: GESTÃO OPERACIONAL (Trabalhadores Autônomos)
// ============================================================================

// WORKERS (Trabalhadores)
export async function createWorker(worker: InsertWorker) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(workers).values(worker);
  return result;
}

export async function getWorkerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(workers)
    .where(eq(workers.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllWorkers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(workers).orderBy(desc(workers.createdAt));
}

export async function getWorkersByCPF(cpf: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(workers)
    .where(eq(workers.cpf, cpf))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateWorker(id: number, data: Partial<InsertWorker>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(workers).set(data).where(eq(workers.id, id));
}

// RISK CALCULATION (CRÍTICO)
export async function calculateWorkerRisk(
  workerId: number,
  clientId: number,
  locationId: number
) {
  const db = await getDb();
  if (!db) return { score: 0, level: "low" as const };

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);

  // Calcular dias consecutivos no mesmo local
  const recentAllocations = await db
    .select()
    .from(allocations)
    .where(
      and(
        eq(allocations.workerId, workerId),
        eq(allocations.locationId, locationId),
        sql`${allocations.workDate} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
      )
    )
    .orderBy(desc(allocations.workDate));

  let consecutiveDays = 0;
  let lastDate: Date | null = null;

  for (const alloc of recentAllocations) {
    const allocDate = new Date(alloc.workDate);
    if (!lastDate) {
      consecutiveDays = 1;
      lastDate = allocDate;
    } else {
      const diffDays = Math.floor(
        (lastDate.getTime() - allocDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        consecutiveDays++;
        lastDate = allocDate;
      } else {
        break;
      }
    }
  }

  // Calcular dias no mês no mesmo cliente
  const daysThisMonth = await db
    .select({ count: count() })
    .from(allocations)
    .where(
      and(
        eq(allocations.workerId, workerId),
        eq(allocations.clientId, clientId),
        sql`${allocations.workDate} >= ${firstDayOfMonth.toISOString().split("T")[0]}`
      )
    );

  const daysInMonth = daysThisMonth[0]?.count || 0;

  // Calcular meses trabalhando no mesmo cliente
  const monthsWithClient = await db
    .select({
      month: sql<string>`DATE_FORMAT(${allocations.workDate}, '%Y-%m') as month`,
    })
    .from(allocations)
    .where(
      and(
        eq(allocations.workerId, workerId),
        eq(allocations.clientId, clientId),
        sql`${allocations.workDate} >= ${threeMonthsAgo.toISOString().split("T")[0]}`
      )
    )
    .groupBy(sql`month`);

  const monthsCount = monthsWithClient.length;

  // Calcular score
  const score = consecutiveDays * 10 + daysInMonth * 5 + monthsCount * 20;

  // Determinar nível
  let level: "low" | "medium" | "high" | "critical";
  if (score <= 50) level = "low";
  else if (score <= 100) level = "medium";
  else if (score <= 150) level = "high";
  else level = "critical";

  return {
    score,
    level,
    consecutiveDays,
    daysInMonth,
    monthsCount,
  };
}

export async function updateWorkerRiskScore(
  workerId: number,
  score: number,
  level: "low" | "medium" | "high" | "critical"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(workers)
    .set({ riskScore: score, riskLevel: level })
    .where(eq(workers.id, workerId));
}

// ALLOCATIONS (Alocações)
export async function createAllocation(allocation: InsertAllocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const risk = await calculateWorkerRisk(
    allocation.workerId,
    allocation.clientId,
    allocation.locationId
  );

  allocation.consecutiveDays = (risk.consecutiveDays || 0) + 1;
  allocation.daysThisMonth = (risk.daysInMonth || 0) + 1;
  allocation.riskFlag = risk.level === "high" || risk.level === "critical";

  const result = await db.insert(allocations).values(allocation);

  await updateWorkerRiskScore(allocation.workerId, risk.score, risk.level);

  return result;
}

export async function getAllocations(filters?: {
  workerId?: number;
  clientId?: number;
  locationId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(allocations);

  const conditions = [];
  if (filters?.workerId)
    conditions.push(eq(allocations.workerId, filters.workerId));
  if (filters?.clientId)
    conditions.push(eq(allocations.clientId, filters.clientId));
  if (filters?.locationId)
    conditions.push(eq(allocations.locationId, filters.locationId));
  if (filters?.startDate)
    conditions.push(sql`${allocations.workDate} >= ${filters.startDate}`);
  if (filters?.endDate)
    conditions.push(sql`${allocations.workDate} <= ${filters.endDate}`);
  if (filters?.status)
    conditions.push(eq(allocations.status, filters.status as any));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return await query.orderBy(desc(allocations.workDate));
}

export async function updateAllocation(
  id: number,
  data: Partial<InsertAllocation>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(allocations).set(data).where(eq(allocations.id, id));
}

// CLIENTS
export async function createClient(client: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(clients).values(client);
}

export async function getAllClients() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// MÓDULO: RH PRIME (Funcionários CLT)
// ============================================================================

// EMPLOYEES
export async function listEmployees(search?: string) {
  const db = await getDb();
  if (!db) return [];

  if (search) {
    return db
      .select()
      .from(employees)
      .where(
        or(
          like(employees.fullName, `%${search}%`),
          like(employees.cpf, `%${search}%`)
        )
      )
      .orderBy(asc(employees.fullName));
  }
  return db.select().from(employees).orderBy(asc(employees.fullName));
}

export async function getEmployee(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.id, id))
    .limit(1);
  return result[0];
}

export async function createEmployee(data: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const result = await db.insert(employees).values(data);
  const employeeId = result[0].insertId;

  return await getEmployee(employeeId);
}

export async function updateEmployee(
  id: number,
  data: Partial<InsertEmployee>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.update(employees).set(data).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.delete(employees).where(eq(employees.id, id));
}

export async function countEmployees() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: count() }).from(employees);
  return result[0]?.count ?? 0;
}

// POSITIONS
export async function listPositions() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(positions).orderBy(asc(positions.title));
}

export async function getPosition(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(positions)
    .where(eq(positions.id, id))
    .limit(1);
  return result[0];
}

export async function createPosition(data: InsertPosition) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const result = await db.insert(positions).values(data);
  return { id: result[0].insertId };
}

export async function updatePosition(
  id: number,
  data: Partial<InsertPosition>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.update(positions).set(data).where(eq(positions.id, id));
}

export async function deletePosition(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.delete(positions).where(eq(positions.id, id));
}

// VACATIONS
export async function listVacations(employeeId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (employeeId) {
    return db
      .select()
      .from(vacations)
      .where(eq(vacations.employeeId, employeeId))
      .orderBy(desc(vacations.acquisitionStart));
  }
  return db.select().from(vacations).orderBy(desc(vacations.acquisitionStart));
}

export async function getVacation(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(vacations)
    .where(eq(vacations.id, id))
    .limit(1);
  return result[0];
}

export async function createVacation(data: InsertVacation) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const result = await db.insert(vacations).values(data);
  return { id: result[0].insertId };
}

export async function updateVacation(
  id: number,
  data: Partial<InsertVacation>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.update(vacations).set(data).where(eq(vacations.id, id));
}

// MEDICAL EXAMS
export async function listMedicalExams(employeeId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (employeeId) {
    return db
      .select()
      .from(medicalExams)
      .where(eq(medicalExams.employeeId, employeeId))
      .orderBy(desc(medicalExams.examDate));
  }
  return db.select().from(medicalExams).orderBy(desc(medicalExams.examDate));
}

export async function createMedicalExam(data: InsertMedicalExam) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const result = await db.insert(medicalExams).values(data);
  return { id: result[0].insertId };
}

export async function updateMedicalExam(
  id: number,
  data: Partial<InsertMedicalExam>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.update(medicalExams).set(data).where(eq(medicalExams.id, id));
}

// NOTIFICATIONS
export async function listNotifications(unreadOnly?: boolean) {
  const db = await getDb();
  if (!db) return [];

  if (unreadOnly) {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.isRead, false))
      .orderBy(desc(notifications.createdAt));
  }
  return db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(100);
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const result = await db.insert(notifications).values(data);
  return { id: result[0].insertId };
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id));
}

export async function countUnreadNotifications() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(eq(notifications.isRead, false));
  return result[0]?.count ?? 0;
}

// AUDIT LOG
export async function createAuditEntry(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;

  await db.insert(auditLogs).values(data);
}

export async function listAuditLog(tableName?: string, recordId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (tableName) conditions.push(eq(auditLogs.resource, tableName));
  if (recordId) conditions.push(eq(auditLogs.resourceId, recordId));

  if (conditions.length > 0) {
    return db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.timestamp))
      .limit(100);
  }
  return db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.timestamp))
    .limit(100);
}

// SETTINGS
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return result[0]?.value;
}

export async function upsertSetting(
  key: string,
  value: string,
  description?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db
    .insert(settings)
    .values({ key, value, description: description ?? "" })
    .onDuplicateKeyUpdate({ set: { value } });
}

export async function listSettings() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(settings).orderBy(asc(settings.key));
}

// DASHBOARD STATS (RH Prime)
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      statusCounts: [],
      overdueVacations: 0,
      expiredExams: 0,
      unreadNotifications: 0,
    };
  }

  const today = new Date().toISOString().split("T")[0];

  const [
    totalResult,
    activeResult,
    statusCounts,
    overdueVacResult,
    expiredExamResult,
    unreadResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(employees),
    db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.status, "Ativo")),
    db
      .select({ status: employees.status, count: count() })
      .from(employees)
      .groupBy(employees.status),
    db
      .select({ count: count() })
      .from(vacations)
      .where(
        and(
          sql`${vacations.concessionLimit} <= ${today}`,
          eq(vacations.status, "Pendente")
        )
      ),
    db
      .select({ count: count() })
      .from(medicalExams)
      .where(
        and(
          sql`${medicalExams.expiryDate} <= ${today}`,
          eq(medicalExams.status, "Válido")
        )
      ),
    db
      .select({ count: count() })
      .from(notifications)
      .where(eq(notifications.isRead, false)),
  ]);

  return {
    totalEmployees: totalResult[0]?.count ?? 0,
    activeEmployees: activeResult[0]?.count ?? 0,
    statusCounts,
    overdueVacations: overdueVacResult[0]?.count ?? 0,
    expiredExams: expiredExamResult[0]?.count ?? 0,
    unreadNotifications: unreadResult[0]?.count ?? 0,
  };
}

// ============================================================================
// EXPORTS ADICIONAIS (funções que faltam dos módulos originais)
// ============================================================================

// Adicione aqui outras funções que precisem ser exportadas dos módulos originais
// Por enquanto, este schema unificado contém as principais funções de ambos os sistemas
