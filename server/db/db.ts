import { eq, and, gte, lte, lt, desc, sql, count, or, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { 
  InsertUser, users,
  workers, InsertWorker, Worker,
  clients, InsertClient,
  contracts, InsertContract,
  shifts, InsertShift,
  workLocations, InsertWorkLocation,
  allocations, InsertAllocation,
  workOffers, InsertWorkOffer,
  workerTerms, InsertWorkerTerm,
  shiftChecklists, InsertShiftChecklist,
  epiRecords, InsertEpiRecord,
  incidents, InsertIncident,
  payments, InsertPayment,
  evaluations, InsertEvaluation,
  procedures, InsertProcedure,
  procedureReadLogs, InsertProcedureReadLog,
  operations, InsertOperation,
  operationMembers, InsertOperationMember,
  operationIncidents, InsertOperationIncident,
  workerBlockHistory,
  workerRefusals, InsertWorkerRefusal,
  workerAutonomyMetrics, InsertWorkerAutonomyMetrics
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
// USERS
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
      values.role = 'admin';
      updateSet.role = 'admin';
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// WORKERS (Trabalhadores)
// ============================================================================

export async function createWorker(worker: InsertWorker) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(workers).values(worker);
  return result;
}

export async function getWorkerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
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
  
  const result = await db.select().from(workers).where(eq(workers.cpf, cpf)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateWorker(id: number, data: Partial<InsertWorker>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(workers).set(data).where(eq(workers.id, id));
}

// ============================================================================
// RISK CALCULATION (CRÍTICO)
// ============================================================================

/**
 * Calcula o score de risco trabalhista de um trabalhador
 * Fórmula: (Dias Consecutivos × 10) + (Dias/Mês × 5) + (Meses no Mesmo Cliente × 20)
 * 
 * 0-50: Baixo (🟢)
 * 51-100: Médio (🟡)
 * 101-150: Alto (🔴)
 * 151+: Crítico (🔴🔴)
 */
export async function calculateWorkerRisk(workerId: number, clientId: number, locationId: number) {
  const db = await getDb();
  if (!db) return { score: 0, level: 'low' as const };
  
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
      const diffDays = Math.floor((lastDate.getTime() - allocDate.getTime()) / (1000 * 60 * 60 * 24));
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
        sql`${allocations.workDate} >= ${firstDayOfMonth.toISOString().split('T')[0]}`
      )
    );
  
  const daysInMonth = daysThisMonth[0]?.count || 0;
  
  // Calcular meses trabalhando no mesmo cliente
  const monthsWithClient = await db
    .select({ 
      month: sql<string>`DATE_FORMAT(${allocations.workDate}, '%Y-%m') as month` 
    })
    .from(allocations)
    .where(
      and(
        eq(allocations.workerId, workerId),
        eq(allocations.clientId, clientId),
        sql`${allocations.workDate} >= ${threeMonthsAgo.toISOString().split('T')[0]}`
      )
    )
    .groupBy(sql`month`);
  
  const monthsCount = monthsWithClient.length;
  
  // Calcular score
  const score = (consecutiveDays * 10) + (daysInMonth * 5) + (monthsCount * 20);
  
  // Determinar nível
  let level: 'low' | 'medium' | 'high' | 'critical';
  if (score <= 50) level = 'low';
  else if (score <= 100) level = 'medium';
  else if (score <= 150) level = 'high';
  else level = 'critical';
  
  return {
    score,
    level,
    consecutiveDays,
    daysInMonth,
    monthsCount
  };
}

export async function updateWorkerRiskScore(workerId: number, score: number, level: 'low' | 'medium' | 'high' | 'critical') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(workers)
    .set({ riskScore: score, riskLevel: level })
    .where(eq(workers.id, workerId));
}

// ============================================================================
// ALLOCATIONS (Alocações)
// ============================================================================

export async function createAllocation(allocation: InsertAllocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Calcular risco antes de criar alocação
  const risk = await calculateWorkerRisk(
    allocation.workerId,
    allocation.clientId,
    allocation.locationId
  );
  
  // Atualizar dados de risco na alocação
  allocation.consecutiveDays = (risk.consecutiveDays || 0) + 1; // +1 porque esta é uma nova alocação
  allocation.daysThisMonth = (risk.daysInMonth || 0) + 1;
  allocation.riskFlag = risk.level === 'high' || risk.level === 'critical';
  
  const result = await db.insert(allocations).values(allocation);
  
  // Atualizar score de risco do trabalhador
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
  if (filters?.workerId) conditions.push(eq(allocations.workerId, filters.workerId));
  if (filters?.clientId) conditions.push(eq(allocations.clientId, filters.clientId));
  if (filters?.locationId) conditions.push(eq(allocations.locationId, filters.locationId));
  if (filters?.startDate) conditions.push(sql`${allocations.workDate} >= ${filters.startDate}`);
  if (filters?.endDate) conditions.push(sql`${allocations.workDate} <= ${filters.endDate}`);
  if (filters?.status) conditions.push(eq(allocations.status, filters.status as any));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query.orderBy(desc(allocations.workDate));
}

export async function updateAllocation(id: number, data: Partial<InsertAllocation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(allocations).set(data).where(eq(allocations.id, id));
}

// ============================================================================
// WORK OFFERS (Ofertas de Trabalho - Documentação de Autonomia)
// ============================================================================

export async function createWorkOffer(offer: InsertWorkOffer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(workOffers).values(offer);
}

export async function getWorkerOffers(workerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(workOffers)
    .where(eq(workOffers.workerId, workerId))
    .orderBy(desc(workOffers.createdAt));
}

export async function respondToOffer(offerId: number, response: 'accepted' | 'refused', refusalReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(workOffers)
    .set({ 
      response, 
      refusalReason,
      respondedAt: new Date()
    })
    .where(eq(workOffers.id, offerId));
}

// ============================================================================
// CLIENTS
// ============================================================================

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
  
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// WORK LOCATIONS
// ============================================================================

export async function createWorkLocation(location: InsertWorkLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(workLocations).values(location);
}

export async function getLocationsByClient(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (clientId) {
    return await db
      .select()
      .from(workLocations)
      .where(eq(workLocations.clientId, clientId))
      .orderBy(desc(workLocations.createdAt));
  }
  
  return await db.select().from(workLocations).orderBy(desc(workLocations.createdAt));
}

// ============================================================================
// PAYMENTS
// ============================================================================

export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(payments).values(payment);
}

export async function getWorkerPayments(workerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(payments)
    .where(eq(payments.workerId, workerId))
    .orderBy(desc(payments.periodEnd));
}

// ============================================================================
// WORKER TERMS
// ============================================================================

export async function createWorkerTerm(term: InsertWorkerTerm) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(workerTerms).values(term);
}

export async function getWorkerLatestTerm(workerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(workerTerms)
    .where(eq(workerTerms.workerId, workerId))
    .orderBy(desc(workerTerms.acceptedAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// INCIDENTS
// ============================================================================

export async function createIncident(incident: InsertIncident) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(incidents).values(incident);
}

export async function getAllIncidents() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(incidents).orderBy(desc(incidents.createdAt));
}

// ============================================================================
// EVALUATIONS
// ============================================================================

export async function createEvaluation(evaluation: InsertEvaluation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(evaluations).values(evaluation);
}

export async function getAllocationEvaluations(allocationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(evaluations)
    .where(eq(evaluations.allocationId, allocationId))
    .orderBy(desc(evaluations.createdAt));
}


// ============================================================================
// CONTRACTS (Contratos)
// ============================================================================

export async function createContract(contract: InsertContract) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contracts).values(contract);
  return result;
}

export async function getAllContracts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(contracts)
    .orderBy(desc(contracts.createdAt));
}

export async function getContractsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(contracts)
    .where(eq(contracts.clientId, clientId))
    .orderBy(desc(contracts.createdAt));
}

export async function getActiveContractByClient(clientId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(contracts)
    .where(
      and(
        eq(contracts.clientId, clientId),
        eq(contracts.status, "active")
      )
    )
    .orderBy(desc(contracts.createdAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateContract(id: number, data: Partial<InsertContract>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(contracts)
    .set(data)
    .where(eq(contracts.id, id));
}

// ============================================================================
// SHIFTS (Turnos)
// ============================================================================

export async function createShift(shift: InsertShift) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(shifts).values(shift);
  const insertResult = Array.isArray(result) ? result[0] : result;
  const insertId = Number(insertResult.insertId);
  
  // Fetch and return the created shift
  const [createdShift] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, insertId));
  
  return createdShift;
}

export async function getAllShifts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(shifts)
    .orderBy(desc(shifts.createdAt));
}

export async function getShiftsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(shifts)
    .where(eq(shifts.clientId, clientId))
    .orderBy(shifts.shiftName);
}

export async function updateShift(id: number, data: Partial<InsertShift>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(shifts)
    .set(data)
    .where(eq(shifts.id, id));
  
  // Fetch and return the updated shift
  const [updatedShift] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, id));
  
  return updatedShift;
}


export async function getLocationById(locationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(workLocations).where(eq(workLocations.id, locationId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteShift(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .delete(shifts)
    .where(eq(shifts.id, id));
}


// ============================================================================
// REPORTS (Relatórios)
// ============================================================================

export async function getBiweeklyReport(year: number, month: number, period: "first" | "second", clientId?: number) {
  const db = await getDb();
  if (!db) return { summary: [], details: [] };

  // Determinar intervalo de datas
  const startDay = period === "first" ? 1 : 16;
  const endDay = period === "first" ? 15 : new Date(year, month, 0).getDate(); // último dia do mês
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  // Buscar alocações confirmadas (com check-in) no período
  const allocationsData = await db
    .select({
      allocationId: allocations.id,
      workDate: sql<string>`${allocations.workDate}`,
      workerId: allocations.workerId,
      workerName: workers.fullName,
      clientId: allocations.clientId,
      clientName: clients.companyName,
      locationId: allocations.locationId,
      locationName: workLocations.locationName,
      shiftId: allocations.shiftId,
      shiftName: shifts.shiftName,
      jobFunction: allocations.jobFunction,
      dailyRate: allocations.dailyRate,
      tookMeal: allocations.tookMeal,
      mealCost: allocations.mealCost,
      netPay: allocations.netPay,
      status: allocations.status,
    })
    .from(allocations)
    .leftJoin(workers, eq(allocations.workerId, workers.id))
    .leftJoin(clients, eq(allocations.clientId, clients.id))
    .leftJoin(workLocations, eq(allocations.locationId, workLocations.id))
    .leftJoin(shifts, eq(allocations.shiftId, shifts.id))
    .where(
      and(
        sql`${allocations.workDate} >= ${startDate}`,
        sql`${allocations.workDate} <= ${endDate}`,
        or(
          eq(allocations.status, "completed"),
          eq(allocations.status, "in_progress")
        ),
        isNotNull(allocations.checkInTime), // Apenas com check-in confirmado
        clientId ? eq(allocations.clientId, clientId) : sql`1=1` // Filtro opcional por cliente
      )
    );

  // Agrupar por cliente e turno
  const groupedData: Record<string, {
    clientId: number;
    clientName: string;
    shifts: Record<string, {
      shiftId: number | null;
      shiftName: string;
      personDays: number;
      workers: Array<{
        workerId: number;
        workerName: string;
        workDate: string;
        locationName: string;
        jobFunction: string | null;
        dailyRate: string | null;
        tookMeal: boolean | null;
        mealCost: string | null;
        netPay: string | null;
      }>;
    }>;
    totalPersonDays: number;
  }> = {};

  for (const allocation of allocationsData) {
    const clientKey = `client_${allocation.clientId}`;
    const shiftKey = allocation.shiftId ? `shift_${allocation.shiftId}` : 'shift_none';
    const shiftName = allocation.shiftName || 'Sem turno definido';
    
    if (!groupedData[clientKey]) {
      groupedData[clientKey] = {
        clientId: allocation.clientId,
        clientName: allocation.clientName || 'Cliente desconhecido',
        shifts: {},
        totalPersonDays: 0,
      };
    }

    if (!groupedData[clientKey].shifts[shiftKey]) {
      groupedData[clientKey].shifts[shiftKey] = {
        shiftId: allocation.shiftId,
        shiftName: shiftName,
        personDays: 0,
        workers: [],
      };
    }

    groupedData[clientKey].shifts[shiftKey].personDays += 1;
    groupedData[clientKey].totalPersonDays += 1;
    
    groupedData[clientKey].shifts[shiftKey].workers.push({
      workerId: allocation.workerId,
      workerName: allocation.workerName || 'Trabalhador desconhecido',
      workDate: allocation.workDate || '',
      locationName: allocation.locationName || 'Local desconhecido',
      jobFunction: allocation.jobFunction,
      dailyRate: allocation.dailyRate,
      tookMeal: allocation.tookMeal,
      mealCost: allocation.mealCost,
      netPay: allocation.netPay,
    });
  }

  // Converter para array para facilitar uso no frontend
  const summary = Object.values(groupedData).map(client => ({
    clientId: client.clientId,
    clientName: client.clientName,
    totalPersonDays: client.totalPersonDays,
    shifts: Object.values(client.shifts).map(shift => ({
      shiftId: shift.shiftId,
      shiftName: shift.shiftName,
      personDays: shift.personDays,
      workerCount: shift.workers.length,
    })),
  }));

  // Detalhamento completo
  const details = Object.values(groupedData).flatMap(client =>
    Object.values(client.shifts).flatMap(shift =>
      shift.workers.map(worker => ({
        clientId: client.clientId,
        clientName: client.clientName,
        shiftId: shift.shiftId,
        shiftName: shift.shiftName,
        ...worker,
      }))
    )
  );

  return {
    period: {
      year,
      month,
      period,
      startDate,
      endDate,
    },
    summary,
    details,
    totalPersonDays: allocationsData.length,
  };
}


// ============================================================================
// WORKER REGISTRATION (Cadastro de trabalhadores)
// ============================================================================

export async function createWorkerRegistration(data: {
  fullName: string;
  cpf: string;
  dateOfBirth: string;
  motherName: string;
  phone: string;
  email?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  pixKey: string;
  pixKeyType: "cpf" | "cnpj" | "email" | "phone" | "random";
  documentPhotoUrl: string;
  documentType: "rg" | "cnh" | "rne";
  workerType: "daily" | "freelancer" | "mei" | "clt";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(workers).values({
    fullName: data.fullName,
    cpf: data.cpf,
    dateOfBirth: new Date(data.dateOfBirth),
    motherName: data.motherName,
    phone: data.phone,
    email: data.email,
    street: data.street,
    number: data.number,
    complement: data.complement,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    pixKey: data.pixKey,
    pixKeyType: data.pixKeyType,
    documentPhotoUrl: data.documentPhotoUrl,
    documentType: data.documentType,
    workerType: data.workerType,
    registrationStatus: "pending",
    status: "inactive",
  });

  const insertId = Number((Array.isArray(result) ? result[0] : result).insertId);
  
  // Retornar o trabalhador criado
  const [worker] = await db.select().from(workers).where(eq(workers.id, insertId));
  return worker;
}

export async function getPendingWorkerRegistrations() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(workers)
    .where(eq(workers.registrationStatus, "pending"))
    .orderBy(desc(workers.createdAt));
}

export async function approveWorkerRegistration(workerId: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(workers)
    .set({
      registrationStatus: "approved",
      status: "active",
      approvedBy,
      approvedAt: new Date(),
    })
    .where(eq(workers.id, workerId));

  const [worker] = await db.select().from(workers).where(eq(workers.id, workerId));
  return worker;
}

export async function rejectWorkerRegistration(workerId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(workers)
    .set({
      registrationStatus: "rejected",
      rejectionReason: reason,
    })
    .where(eq(workers.id, workerId));

  const [worker] = await db.select().from(workers).where(eq(workers.id, workerId));
  return worker;
}


// ============================================================================
// OPERATIONS
// ============================================================================

export async function createOperation(data: {
  clientId: number;
  locationId: number;
  contractId: number | null;
  shiftId: number;
  leaderId: number;
  createdBy: number;
  operationName: string;
  workDate: string;
  description?: string;
  members: Array<{
    workerId: number;
    jobFunction: string;
    dailyRate: number;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { members, ...operationData } = data;
  
  // Calcular totais
  const totalWorkers = members.length;
  const totalDailyRate = members.reduce((sum, m) => sum + m.dailyRate, 0);
  
  // Criar operação
  const [result] = await db.insert(schema.operations).values({
    clientId: operationData.clientId,
    locationId: operationData.locationId,
    contractId: operationData.contractId,
    shiftId: operationData.shiftId,
    leaderId: operationData.leaderId,
    createdBy: operationData.createdBy,
    operationName: operationData.operationName,
    workDate: new Date(operationData.workDate),
    description: operationData.description,
    status: "created",
  });
  
  const operationId = Number(result.insertId);
  
  // Criar membros
  for (const member of members) {
    await db.insert(schema.operationMembers).values({
      operationId,
      workerId: member.workerId,
      jobFunction: member.jobFunction,
      dailyRate: member.dailyRate.toString(),
      status: "invited",
    });
  }
  
  // Buscar operação completa
  const [operation] = await db
    .select()
    .from(schema.operations)
    .where(eq(schema.operations.id, operationId));
    
  return operation;
}

export async function getOperationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [operation] = await db
    .select()
    .from(schema.operations)
    .where(eq(schema.operations.id, id));
    
  if (!operation) return null;
  
  // Buscar membros
  const members = await db
    .select({
      id: schema.operationMembers.id,
      workerId: schema.operationMembers.workerId,
      workerName: schema.workers.fullName,
      workerCpf: schema.workers.cpf,
      jobFunction: schema.operationMembers.jobFunction,
      dailyRate: schema.operationMembers.dailyRate,
      status: schema.operationMembers.status,
      acceptedAt: schema.operationMembers.acceptedAt,
      checkInTime: schema.operationMembers.checkInTime,
      checkOutTime: schema.operationMembers.checkOutTime,
      tookMeal: schema.operationMembers.tookMeal,
      usedEpi: schema.operationMembers.usedEpi,
      notes: schema.operationMembers.notes,
    })
    .from(schema.operationMembers)
    .leftJoin(schema.workers, eq(schema.operationMembers.workerId, schema.workers.id))
    .where(eq(schema.operationMembers.operationId, id));
  
  return { ...operation, members };
}

export async function getOperationsByLeader(leaderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const operations = await db
    .select({
      id: schema.operations.id,
      operationName: schema.operations.operationName,
      workDate: schema.operations.workDate,
      status: schema.operations.status,
      clientName: schema.clients.companyName,
      locationName: schema.workLocations.locationName,
      shiftName: schema.shifts.shiftName,
      totalWorkers: schema.operations.totalWorkers,
      createdAt: schema.operations.createdAt,
    })
    .from(schema.operations)
    .leftJoin(schema.clients, eq(schema.operations.clientId, schema.clients.id))
    .leftJoin(schema.workLocations, eq(schema.operations.locationId, schema.workLocations.id))
    .leftJoin(schema.shifts, eq(schema.operations.shiftId, schema.shifts.id))
    .where(eq(schema.operations.leaderId, leaderId))
    .orderBy(desc(schema.operations.createdAt));
    
  return operations;
}

export async function acceptOperation(memberId: number, cpf: string, ip: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se o CPF corresponde ao trabalhador
  const [member] = await db
    .select({
      workerId: schema.operationMembers.workerId,
      workerCpf: schema.workers.cpf,
    })
    .from(schema.operationMembers)
    .leftJoin(schema.workers, eq(schema.operationMembers.workerId, schema.workers.id))
    .where(eq(schema.operationMembers.id, memberId));
    
  if (!member || member.workerCpf !== cpf) {
    throw new Error("CPF não corresponde ao trabalhador");
  }
  
  // Atualizar status
  await db
    .update(schema.operationMembers)
    .set({
      status: "accepted",
      acceptedAt: new Date(),
      acceptanceIp: ip,
      cpfConfirmed: true,
      termAccepted: true,
    })
    .where(eq(schema.operationMembers.id, memberId));
    
  return { success: true };
}

export async function startOperation(operationId: number, leaderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se o líder é o correto
  const [operation] = await db
    .select()
    .from(schema.operations)
    .where(eq(schema.operations.id, operationId));
    
  if (!operation || operation.leaderId !== leaderId) {
    throw new Error("Operação não encontrada ou líder incorreto");
  }
  
  // Atualizar status
  await db
    .update(schema.operations)
    .set({
      status: "in_progress",
      startedAt: new Date(),
    })
    .where(eq(schema.operations.id, operationId));
    
  return { success: true };
}

export async function checkInMember(memberId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(schema.operationMembers)
    .set({
      status: "present",
      checkInTime: new Date(),
    })
    .where(eq(schema.operationMembers.id, memberId));
    
  return { success: true };
}

export async function checkOutMember(memberId: number, data: {
  tookMeal: boolean;
  usedEpi: boolean;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(schema.operationMembers)
    .set({
      status: "completed",
      checkOutTime: new Date(),
      tookMeal: data.tookMeal,
      usedEpi: data.usedEpi,
      notes: data.notes,
    })
    .where(eq(schema.operationMembers.id, memberId));
    
  return { success: true };
}

export async function completeOperation(operationId: number, leaderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se o líder é o correto
  const [operation] = await db
    .select()
    .from(schema.operations)
    .where(eq(schema.operations.id, operationId));
    
  if (!operation || operation.leaderId !== leaderId) {
    throw new Error("Operação não encontrada ou líder incorreto");
  }
  
  // Atualizar status
  await db
    .update(schema.operations)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(schema.operations.id, operationId));
    
  return { success: true };
}

export async function createOperationIncident(data: {
  operationId: number;
  memberId?: number;
  reportedBy: number;
  incidentType: "absence" | "late_arrival" | "early_departure" | "misconduct" | "accident" | "equipment_issue" | "quality_issue" | "other";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  photos?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(schema.operationIncidents).values(data);
  
  const incidentId = Number(result.insertId);
  
  const [incident] = await db
    .select()
    .from(schema.operationIncidents)
    .where(eq(schema.operationIncidents.id, incidentId));
    
  return incident;
}

export async function getOperationIncidents(operationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const incidents = await db
    .select({
      id: schema.operationIncidents.id,
      memberId: schema.operationIncidents.memberId,
      workerName: schema.workers.fullName,
      reportedByName: schema.users.name,
      incidentType: schema.operationIncidents.incidentType,
      severity: schema.operationIncidents.severity,
      description: schema.operationIncidents.description,
      photos: schema.operationIncidents.photos,
      status: schema.operationIncidents.status,
      createdAt: schema.operationIncidents.createdAt,
    })
    .from(schema.operationIncidents)
    .leftJoin(schema.operationMembers, eq(schema.operationIncidents.memberId, schema.operationMembers.id))
    .leftJoin(schema.workers, eq(schema.operationMembers.workerId, schema.workers.id))
    .leftJoin(schema.users, eq(schema.operationIncidents.reportedBy, schema.users.id))
    .where(eq(schema.operationIncidents.operationId, operationId))
    .orderBy(desc(schema.operationIncidents.createdAt));
    
  return incidents;
}


// ============================================================================
// CONTROLE DE CONFORMIDADE E BLOQUEIOS
// ============================================================================

export async function blockWorker(params: {
  workerId: number;
  reason: string;
  blockedBy: number;
  blockType: "temporary" | "permanent";
  daysBlocked?: number; // Para bloqueios temporários
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { workerId, reason, blockedBy, blockType, daysBlocked } = params;
  
  const expiresAt = blockType === "temporary" && daysBlocked
    ? new Date(Date.now() + daysBlocked * 24 * 60 * 60 * 1000)
    : null;
  
  // Atualizar trabalhador
  await db.update(workers)
    .set({
      isBlocked: true,
      blockReason: reason,
      blockedAt: new Date(),
      blockedBy,
      blockType,
      blockExpiresAt: expiresAt,
      status: "blocked",
    })
    .where(eq(workers.id, workerId));
  
  // Registrar no histórico
  await db.insert(workerBlockHistory).values({
    workerId,
    actionBy: blockedBy,
    action: "blocked",
    reason,
    blockType,
    expiresAt,
  });
  
  return { success: true };
}

export async function unblockWorker(params: {
  workerId: number;
  reason: string;
  unblockedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { workerId, reason, unblockedBy } = params;
  
  // Atualizar trabalhador
  await db.update(workers)
    .set({
      isBlocked: false,
      blockReason: null,
      blockedAt: null,
      blockedBy: null,
      blockType: null,
      blockExpiresAt: null,
      status: "active",
    })
    .where(eq(workers.id, workerId));
  
  // Registrar no histórico
  await db.insert(workerBlockHistory).values({
    workerId,
    actionBy: unblockedBy,
    action: "unblocked",
    reason,
  });
  
  return { success: true };
}

export async function getBlockedWorkers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(workers).where(eq(workers.isBlocked, true));
}

export async function getWorkerBlockHistory(workerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select()
    .from(workerBlockHistory)
    .where(eq(workerBlockHistory.workerId, workerId))
    .orderBy(desc(workerBlockHistory.createdAt));
}

export async function checkAndUnblockExpiredBlocks() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  
  // Buscar trabalhadores com bloqueio temporário expirado
  const expiredBlocks = await db.select()
    .from(workers)
    .where(
      and(
        eq(workers.isBlocked, true),
        eq(workers.blockType, "temporary"),
        lt(workers.blockExpiresAt, now)
      )
    );
  
  // Desbloquear automaticamente
  for (const worker of expiredBlocks) {
    await db.update(workers)
      .set({
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        blockedBy: null,
        blockType: null,
        blockExpiresAt: null,
        status: "active",
      })
      .where(eq(workers.id, worker.id));
    
    // Registrar no histórico
    await db.insert(workerBlockHistory).values({
      workerId: worker.id,
      actionBy: 1, // Sistema
      action: "unblocked",
      reason: "Bloqueio temporário expirado automaticamente",
    });
  }
  
  return { unblocked: expiredBlocks.length };
}

export async function autoBlockBasedOnIncident(params: {
  workerId: number;
  incidentType: string;
  blockedBy: number;
}) {
  const { workerId, incidentType, blockedBy } = params;
  
  // Regras de bloqueio automático
  const blockRules: Record<string, { type: "temporary" | "permanent", days?: number, reason: string }> = {
    absence: {
      type: "temporary",
      days: 3,
      reason: "Falta não justificada - Bloqueio automático de 3 dias"
    },
    misconduct: {
      type: "permanent",
      reason: "Conduta inadequada - Bloqueio permanente até revisão administrativa"
    },
    accident: {
      type: "permanent",
      reason: "Acidente registrado - Bloqueio até investigação e treinamento"
    },
  };
  
  const rule = blockRules[incidentType];
  if (!rule) return { blocked: false };
  
  await blockWorker({
    workerId,
    reason: rule.reason,
    blockedBy,
    blockType: rule.type,
    daysBlocked: rule.days,
  });
  
  return { blocked: true, rule };
}

export async function getComplianceMetrics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const totalWorkers = await db.select({ count: sql<number>`count(*)` })
    .from(workers)
    .where(eq(workers.registrationStatus, "approved"));
  
  const blockedWorkers = await db.select({ count: sql<number>`count(*)` })
    .from(workers)
    .where(and(
      eq(workers.isBlocked, true),
      eq(workers.registrationStatus, "approved")
    ));
  
  const temporaryBlocks = await db.select({ count: sql<number>`count(*)` })
    .from(workers)
    .where(and(
      eq(workers.isBlocked, true),
      eq(workers.blockType, "temporary")
    ));
  
  const permanentBlocks = await db.select({ count: sql<number>`count(*)` })
    .from(workers)
    .where(and(
      eq(workers.isBlocked, true),
      eq(workers.blockType, "permanent")
    ));
  
  return {
    totalWorkers: totalWorkers[0]?.count || 0,
    blockedWorkers: blockedWorkers[0]?.count || 0,
    temporaryBlocks: temporaryBlocks[0]?.count || 0,
    permanentBlocks: permanentBlocks[0]?.count || 0,
    complianceRate: totalWorkers[0]?.count 
      ? ((totalWorkers[0].count - (blockedWorkers[0]?.count || 0)) / totalWorkers[0].count * 100).toFixed(1)
      : "100.0"
  };
}


// ===== BLOQUEIO POR CONTINUIDADE =====

// Calcular dias consecutivos de trabalho no mesmo cliente
export async function calculateConsecutiveDays(workerId: number, clientId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Buscar operações dos últimos 30 dias
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Join operationMembers com operations para filtrar por clientId
  const recentOperations = await db
    .select({
      workDate: operations.workDate,
      status: operationMembers.status,
    })
    .from(operationMembers)
    .innerJoin(operations, eq(operationMembers.operationId, operations.id))
    .where(
      and(
        eq(operationMembers.workerId, workerId),
        eq(operations.clientId, clientId),
        gte(operations.workDate, thirtyDaysAgo),
        or(
          eq(operationMembers.status, "completed"),
          eq(operationMembers.status, "present")
        )
      )
    )
    .orderBy(desc(operations.workDate));

  if (recentOperations.length === 0) return 0;

  // Calcular dias consecutivos a partir da data mais recente
  let consecutiveDays = 0;
  // Começar da data mais recente encontrada (primeira no array ordenado por desc)
  const mostRecentDate = new Date(recentOperations[0].workDate);
  mostRecentDate.setHours(0, 0, 0, 0);
  let currentDate = new Date(mostRecentDate);

  for (let i = 0; i < 10; i++) {
    const hasOperation = recentOperations.some((op: any) => {
      const opDate = new Date(op.workDate);
      opDate.setHours(0, 0, 0, 0);
      return opDate.getTime() === currentDate.getTime();
    });

    if (hasOperation) {
      consecutiveDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return consecutiveDays;
}

// Verificar e bloquear trabalhador por continuidade
export async function checkAndBlockByContinuity(
  workerId: number,
  clientId: number,
  userId: number
): Promise<{ blocked: boolean; consecutiveDays: number; message: string }> {
  const consecutiveDays = await calculateConsecutiveDays(workerId, clientId);

  if (consecutiveDays >= 3) {
    // Bloquear trabalhador temporariamente por 7 dias
    await blockWorker({
      workerId,
      blockType: "temporary",
      reason: `Bloqueio automático: ${consecutiveDays} dias consecutivos no mesmo cliente (limite legal: 2 dias). Risco trabalhista alto.`,
      blockedBy: userId,
      daysBlocked: 7,
    });

    return {
      blocked: true,
      consecutiveDays,
      message: `Trabalhador bloqueado automaticamente por ${consecutiveDays} dias consecutivos`,
    };
  }

  return {
    blocked: false,
    consecutiveDays,
    message: consecutiveDays >= 2
      ? `ALERTA: Trabalhador próximo do limite (${consecutiveDays} dias consecutivos)`
      : "OK",
  };
}


// ============================================================================
// DOCUMENTAÇÃO DE AUTONOMIA
// ============================================================================

/**
 * Registrar recusa de trabalho por um trabalhador
 */
export async function createWorkerRefusal(data: {
  workerId: number;
  operationId?: number;
  clientId?: number;
  refusalReason: string;
  refusalType: "scheduling_conflict" | "distance" | "rate_too_low" | "personal_reasons" | "already_working" | "other";
  refusalDate: Date;
  evidence?: string;
  registeredBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(workerRefusals).values({
    workerId: data.workerId,
    operationId: data.operationId || null,
    clientId: data.clientId || null,
    refusalReason: data.refusalReason,
    refusalType: data.refusalType,
    refusalDate: data.refusalDate,
    evidence: data.evidence || null,
    registeredBy: data.registeredBy,
  });

  // Atualizar métricas de autonomia
  await updateWorkerAutonomyMetrics(data.workerId);

  return { id: result.insertId, message: "Recusa registrada com sucesso" };
}

/**
 * Listar recusas de um trabalhador
 */
export async function getWorkerRefusals(workerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: workerRefusals.id,
      refusalReason: workerRefusals.refusalReason,
      refusalType: workerRefusals.refusalType,
      refusalDate: workerRefusals.refusalDate,
      evidence: workerRefusals.evidence,
      createdAt: workerRefusals.createdAt,
      clientName: clients.companyName,
      operationName: operations.operationName,
    })
    .from(workerRefusals)
    .leftJoin(clients, eq(workerRefusals.clientId, clients.id))
    .leftJoin(operations, eq(workerRefusals.operationId, operations.id))
    .where(eq(workerRefusals.workerId, workerId))
    .orderBy(desc(workerRefusals.refusalDate));
}

/**
 * Calcular e atualizar métricas de autonomia de um trabalhador
 */
export async function updateWorkerAutonomyMetrics(workerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Contar recusas
  const refusalsCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(workerRefusals)
    .where(eq(workerRefusals.workerId, workerId));
  
  const totalRefusals = refusalsCount[0]?.count || 0;

  // Contar clientes únicos (através de operations)
  const uniqueClientsCount = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${operations.clientId})` })
    .from(operationMembers)
    .innerJoin(operations, eq(operationMembers.operationId, operations.id))
    .where(eq(operationMembers.workerId, workerId));
  
  const uniqueClients = uniqueClientsCount[0]?.count || 0;

  // Contar locais únicos (através de operations)
  const uniqueLocationsCount = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${operations.locationId})` })
    .from(operationMembers)
    .innerJoin(operations, eq(operationMembers.operationId, operations.id))
    .where(eq(operationMembers.workerId, workerId));
  
  const uniqueLocations = uniqueLocationsCount[0]?.count || 0;

  // Contar operações totais
  const operationsCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(operationMembers)
    .where(eq(operationMembers.workerId, workerId));
  
  const totalOperations = operationsCount[0]?.count || 0;

  // Buscar datas de primeira e última operação
  const operationDates = await db
    .select({
      firstDate: sql<Date>`MIN(${operations.workDate})`,
      lastDate: sql<Date>`MAX(${operations.workDate})`,
    })
    .from(operationMembers)
    .innerJoin(operations, eq(operationMembers.operationId, operations.id))
    .where(eq(operationMembers.workerId, workerId));

  const firstOperationDate = operationDates[0]?.firstDate || null;
  const lastOperationDate = operationDates[0]?.lastDate || null;

  // Calcular score de autonomia (0-100)
  // Fatores: recusas (30%), clientes únicos (30%), locais únicos (20%), operações totais (20%)
  const refusalsScore = Math.min(totalRefusals * 10, 30); // Máximo 30 pontos
  const clientsScore = Math.min(uniqueClients * 10, 30); // Máximo 30 pontos
  const locationsScore = Math.min(uniqueLocations * 5, 20); // Máximo 20 pontos
  const operationsScore = Math.min(totalOperations * 2, 20); // Máximo 20 pontos
  
  const autonomyScore = Math.min(
    refusalsScore + clientsScore + locationsScore + operationsScore,
    100
  );

  // Verificar se já existe registro
  const existing = await db
    .select()
    .from(workerAutonomyMetrics)
    .where(eq(workerAutonomyMetrics.workerId, workerId))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar
    await db
      .update(workerAutonomyMetrics)
      .set({
        totalRefusals,
        uniqueClients,
        uniqueLocations,
        totalOperations,
        firstOperationDate,
        lastOperationDate,
        autonomyScore,
        lastCalculatedAt: new Date(),
      })
      .where(eq(workerAutonomyMetrics.workerId, workerId));
  } else {
    // Inserir
    await db.insert(workerAutonomyMetrics).values({
      workerId,
      totalRefusals,
      uniqueClients,
      uniqueLocations,
      totalOperations,
      firstOperationDate,
      lastOperationDate,
      autonomyScore,
      lastCalculatedAt: new Date(),
    });
  }

  return {
    totalRefusals,
    uniqueClients,
    uniqueLocations,
    totalOperations,
    autonomyScore,
  };
}

/**
 * Obter métricas de autonomia de um trabalhador
 */
export async function getWorkerAutonomyMetrics(workerId: number) {
  const db = await getDb();
  if (!db) return null;

  const metrics = await db
    .select()
    .from(workerAutonomyMetrics)
    .where(eq(workerAutonomyMetrics.workerId, workerId))
    .limit(1);

  return metrics[0] || null;
}

/**
 * Listar trabalhadores com baixa autonomia (score < 30)
 */
export async function getWorkersWithLowAutonomy() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      workerId: workerAutonomyMetrics.workerId,
      workerName: workers.fullName,
      workerCpf: workers.cpf,
      totalRefusals: workerAutonomyMetrics.totalRefusals,
      uniqueClients: workerAutonomyMetrics.uniqueClients,
      uniqueLocations: workerAutonomyMetrics.uniqueLocations,
      totalOperations: workerAutonomyMetrics.totalOperations,
      autonomyScore: workerAutonomyMetrics.autonomyScore,
      lastCalculatedAt: workerAutonomyMetrics.lastCalculatedAt,
    })
    .from(workerAutonomyMetrics)
    .innerJoin(workers, eq(workerAutonomyMetrics.workerId, workers.id))
    .where(lt(workerAutonomyMetrics.autonomyScore, 30))
    .orderBy(workerAutonomyMetrics.autonomyScore);
}


// ============================================================================
// CÁLCULO DE RISCOS TRABALHISTAS
// ============================================================================

/**
 * Calcular risco trabalhista de todos os trabalhadores
 * Retorna lista com score de risco, exposição financeira e classificação
 */
export async function calculateWorkerRisks() {
  const db = await getDb();
  if (!db) return [];

  // Buscar todos os trabalhadores ativos
  const allWorkers = await db
    .select({
      id: workers.id,
      fullName: workers.fullName,
      cpf: workers.cpf,
      dailyRate: workers.dailyRate,
      isBlocked: workers.isBlocked,
      blockReason: workers.blockReason,
    })
    .from(workers)
    .where(eq(workers.status, "active"));

  const risksData = [];

  for (const worker of allWorkers) {
    // Calcular dias consecutivos nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOperations = await db
      .select({
        workDate: operations.workDate,
        clientId: operations.clientId,
        dailyRate: operationMembers.dailyRate,
      })
      .from(operationMembers)
      .innerJoin(operations, eq(operationMembers.operationId, operations.id))
      .where(
        and(
          eq(operationMembers.workerId, worker.id),
          gte(operations.workDate, thirtyDaysAgo),
          eq(operationMembers.status, "completed")
        )
      )
      .orderBy(operations.workDate);

    // Agrupar por cliente e calcular dias consecutivos
    const clientConsecutiveDays: Record<number, number> = {};
    const clientGroups: Record<number, Date[]> = {};

    for (const op of recentOperations) {
      const clientId = op.clientId;
      if (!clientGroups[clientId]) {
        clientGroups[clientId] = [];
      }
      clientGroups[clientId].push(op.workDate);
    }

    let maxConsecutiveDays = 0;
    let totalDaysWorked = recentOperations.length;
    let avgDailyRate = 0;

    if (recentOperations.length > 0) {
      avgDailyRate = recentOperations.reduce((sum, op) => 
        sum + parseFloat(op.dailyRate.toString()), 0
      ) / recentOperations.length;
    }

    // Calcular dias consecutivos por cliente
    for (const clientId in clientGroups) {
      const dates = clientGroups[clientId].sort((a, b) => a.getTime() - b.getTime());
      let consecutive = 1;
      let maxForClient = 1;

      for (let i = 1; i < dates.length; i++) {
        const diffDays = Math.floor(
          (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (diffDays === 1) {
          consecutive++;
          maxForClient = Math.max(maxForClient, consecutive);
        } else {
          consecutive = 1;
        }
      }

      clientConsecutiveDays[parseInt(clientId)] = maxForClient;
      maxConsecutiveDays = Math.max(maxConsecutiveDays, maxForClient);
    }

    // Buscar métricas de autonomia
    const autonomyMetrics = await getWorkerAutonomyMetrics(worker.id);
    const autonomyScore = autonomyMetrics?.autonomyScore || 0;

    // Calcular score de risco (0-100, maior = mais risco)
    let riskScore = 0;

    // Fator 1: Dias consecutivos (40 pontos)
    if (maxConsecutiveDays >= 3) {
      riskScore += 40;
    } else if (maxConsecutiveDays === 2) {
      riskScore += 25;
    } else if (maxConsecutiveDays === 1) {
      riskScore += 10;
    }

    // Fator 2: Total de dias trabalhados (20 pontos)
    if (totalDaysWorked >= 20) {
      riskScore += 20;
    } else if (totalDaysWorked >= 15) {
      riskScore += 15;
    } else if (totalDaysWorked >= 10) {
      riskScore += 10;
    }

    // Fator 3: Baixa autonomia (30 pontos)
    if (autonomyScore < 30) {
      riskScore += 30;
    } else if (autonomyScore < 50) {
      riskScore += 15;
    }

    // Fator 4: Bloqueado (10 pontos)
    if (worker.isBlocked) {
      riskScore += 10;
    }

    // Calcular exposição financeira
    const financialExposure = maxConsecutiveDays * avgDailyRate;

    // Classificar risco
    let riskLevel: "low" | "medium" | "high" | "critical";
    if (riskScore >= 70) {
      riskLevel = "critical";
    } else if (riskScore >= 50) {
      riskLevel = "high";
    } else if (riskScore >= 30) {
      riskLevel = "medium";
    } else {
      riskLevel = "low";
    }

    risksData.push({
      workerId: worker.id,
      workerName: worker.fullName,
      workerCpf: worker.cpf,
      maxConsecutiveDays,
      totalDaysWorked,
      avgDailyRate: Math.round(avgDailyRate * 100) / 100,
      financialExposure: Math.round(financialExposure * 100) / 100,
      autonomyScore,
      riskScore,
      riskLevel,
      isBlocked: worker.isBlocked,
      blockReason: worker.blockReason,
      clientsWithConsecutiveDays: Object.keys(clientConsecutiveDays).length,
    });
  }

  // Ordenar por riskScore (maior primeiro)
  return risksData.sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Obter estatísticas gerais de risco
 */
export async function getRiskStatistics() {
  const risks = await calculateWorkerRisks();

  const stats = {
    totalWorkers: risks.length,
    criticalRisk: risks.filter(r => r.riskLevel === "critical").length,
    highRisk: risks.filter(r => r.riskLevel === "high").length,
    mediumRisk: risks.filter(r => r.riskLevel === "medium").length,
    lowRisk: risks.filter(r => r.riskLevel === "low").length,
    totalFinancialExposure: risks.reduce((sum, r) => sum + r.financialExposure, 0),
    avgRiskScore: risks.length > 0 
      ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length 
      : 0,
    workersBlocked: risks.filter(r => r.isBlocked).length,
  };

  return stats;
}
