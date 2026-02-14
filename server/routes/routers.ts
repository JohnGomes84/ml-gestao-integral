import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // WORKERS (Trabalhadores)
  // ============================================================================
  workers: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllWorkers();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getWorkerById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        fullName: z.string(),
        cpf: z.string(),
        phone: z.string(),
        pixKey: z.string().optional(),
        workerType: z.enum(["daily", "clt", "freelancer", "mei"]),
        dailyRate: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const workerData = {
          ...input,
          dailyRate: input.dailyRate?.toString(),
        };
        return await db.createWorker(workerData);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          fullName: z.string().optional(),
          phone: z.string().optional(),
          pixKey: z.string().optional(),
          status: z.enum(["active", "inactive", "blocked"]).optional(),
          dailyRate: z.number().optional(),
        })
      }))
      .mutation(async ({ input }) => {
        const updateData = {
          ...input.data,
          dailyRate: input.data.dailyRate?.toString(),
        };
        return await db.updateWorker(input.id, updateData);
      }),
    
    calculateRisk: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        clientId: z.number(),
        locationId: z.number(),
      }))
      .query(async ({ input }) => {
        const risk = await db.calculateWorkerRisk(
          input.workerId,
          input.clientId,
          input.locationId
        );
        
        return {
          score: risk.score,
          level: risk.level,
          consecutiveDays: risk.consecutiveDays,
          daysInMonth: risk.daysInMonth,
          monthsWithClient: risk.monthsCount,
        };
      }),
    
    getRiskDashboard: protectedProcedure.query(async () => {
      const workers = await db.getAllWorkers();
      
      const lowRisk = workers.filter(w => w.riskLevel === 'low');
      const mediumRisk = workers.filter(w => w.riskLevel === 'medium');
      const highRisk = workers.filter(w => w.riskLevel === 'high');
      const criticalRisk = workers.filter(w => w.riskLevel === 'critical');
      
      return {
        total: workers.length,
        lowRisk: lowRisk.length,
        mediumRisk: mediumRisk.length,
        highRisk: highRisk.length,
        criticalRisk: criticalRisk.length,
        highRiskWorkers: highRisk.concat(criticalRisk),
      };
    }),
  }),

  // ============================================================================
  // CLIENTS (Clientes)
  // ============================================================================
  clients: router({
    list: protectedProcedure.query(async () => {
      const clients = await db.getAllClients();
      
      // Adicionar locais para cada cliente
      const clientsWithLocations = await Promise.all(
        clients.map(async (client) => {
          const locations = await db.getLocationsByClient(client.id);
          return { ...client, locations };
        })
      );
      
      return clientsWithLocations;
    }),
    
    create: protectedProcedure
      .input(z.object({
        companyName: z.string(),
        cnpj: z.string(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createClient(input);
      }),
  }),

  // ============================================================================
  // WORK LOCATIONS (Locais de Trabalho)
  // ============================================================================
  locations: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getLocationsByClient(input.clientId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        locationName: z.string(),
        address: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.createWorkLocation(input);
      }),
  }),

  // ============================================================================
  // ALLOCATIONS (Alocações)
  // ============================================================================
  allocations: router({
    list: protectedProcedure
      .input(z.object({
        workerId: z.number().optional(),
        clientId: z.number().optional(),
        locationId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getAllocations(input);
      }),
    
    create: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        clientId: z.number(),
        locationId: z.number(),
        workDate: z.string(),
        jobFunction: z.string(),
        dailyRate: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Verificar risco antes de criar alocação
        const risk = await db.calculateWorkerRisk(
          input.workerId,
          input.clientId,
          input.locationId
        );
        
        // Bloquear se risco for crítico
        if (risk.level === 'critical') {
          throw new Error(
            `BLOQUEADO: Trabalhador em risco crítico (score: ${risk.score}). ` +
            `${risk.consecutiveDays} dias consecutivos, ${risk.daysInMonth} dias/mês.`
          );
        }
        
        // Alertar se risco for alto
        if (risk.level === 'high') {
          console.warn(
            `⚠️ ATENÇÃO: Trabalhador em risco alto (score: ${risk.score}). ` +
            `Considere rodízio.`
          );
        }
        
        // Converter tipos para o schema
        const allocationData = {
          ...input,
          workDate: new Date(input.workDate),
          dailyRate: input.dailyRate.toString(),
        };
        
        return await db.createAllocation(allocationData);
      }),
    
    suggestWorkers: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        locationId: z.number(),
        workDate: z.string(),
        quantity: z.number().optional().default(5),
      }))
      .query(async ({ input }) => {
        const allWorkers = await db.getAllWorkers();
        const activeWorkers = allWorkers.filter(w => w.status === 'active');
        
        // Calcular risco para cada trabalhador
        const workersWithRisk = await Promise.all(
          activeWorkers.map(async (worker) => {
            const risk = await db.calculateWorkerRisk(
              worker.id,
              input.clientId,
              input.locationId
            );
            return { ...worker, risk };
          })
        );
        
        // Ordenar por menor risco
        const sorted = workersWithRisk.sort((a, b) => a.risk.score - b.risk.score);
        
        // Retornar os melhores candidatos
        const quantity = input.quantity || 5;
        return sorted.slice(0, quantity * 2); // 2x para dar opções
      }),
  }),

  // ============================================================================
  // CONTRACTS (Contratos)
  // ============================================================================
  contracts: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllContracts();
    }),
    
    getByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getContractsByClient(input.clientId);
      }),
    
    getActiveByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getActiveContractByClient(input.clientId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        contractName: z.string(),
        contractNumber: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        dailyRates: z.string(), // JSON string
        providesUniform: z.boolean().default(true),
        providesEpi: z.boolean().default(true),
        providesMeal: z.boolean().default(true),
        mealCost: z.number().default(25),
        mealTicketValue: z.number().default(30),
        billingCycle: z.enum(["weekly", "biweekly", "monthly"]).default("biweekly"),
        chargePerPerson: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const contractData = {
          ...input,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          mealCost: input.mealCost.toString(),
          mealTicketValue: input.mealTicketValue.toString(),
          chargePerPerson: input.chargePerPerson.toString(),
        };
        return await db.createContract(contractData);
      }),
  }),

  // ============================================================================
  // SHIFTS (Turnos)
  // ============================================================================
  shifts: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllShifts();
    }),
    
    getByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getShiftsByClient(input.clientId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        shiftName: z.string(),
        shiftType: z.enum(["morning", "afternoon", "night", "business", "custom"]),
        startTime: z.string(),
        endTime: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createShift(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number(),
        shiftName: z.string(),
        shiftType: z.enum(["morning", "afternoon", "night", "business", "custom"]),
        startTime: z.string(),
        endTime: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateShift(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteShift(input.id);
      }),
  }),

  // ============================================================================
  // SUPERVISOR (Interface para supervisores)
  // ============================================================================
  supervisor: router({
    // Lista alocações do dia para o supervisor
    todayAllocations: protectedProcedure
      .input(z.object({
        date: z.string().optional(), // YYYY-MM-DD
      }))
      .query(async ({ input }) => {
        const date = input.date || new Date().toISOString().split('T')[0];
        return await db.getAllocations({
          startDate: date,
          endDate: date,
          status: 'scheduled',
        });
      }),
    
    // Confirmar entrada do trabalhador
    checkIn: protectedProcedure
      .input(z.object({
        allocationId: z.number(),
        tookMeal: z.boolean(),
        uniformProvided: z.boolean(),
        epiProvided: z.boolean(),
        workerSignature: z.string(),
        location: z.string().optional(), // lat,long
      }))
      .mutation(async ({ input, ctx }) => {
        const { allocationId, workerSignature, location, ...benefits } = input;
        
        // Validate distance if location is provided
        let distanceWarning: string | undefined;
        if (location) {
          const allocations = await db.getAllocations({});
          const allocation = allocations.find(a => a.id === allocationId);
          
          if (allocation && allocation.locationId) {
            const workLocation = await db.getLocationById(allocation.locationId);
            
            if (workLocation && workLocation.latitude && workLocation.longitude) {
              const [checkInLat, checkInLong] = location.split(',').map(Number);
              const workLat = Number(workLocation.latitude);
              const workLong = Number(workLocation.longitude);
              
              // Calculate distance using Haversine formula
              const R = 6371e3; // Earth's radius in meters
              const φ1 = (checkInLat * Math.PI) / 180;
              const φ2 = (workLat * Math.PI) / 180;
              const Δφ = ((workLat - checkInLat) * Math.PI) / 180;
              const Δλ = ((workLong - checkInLong) * Math.PI) / 180;
              
              const a =
                Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = R * c; // Distance in meters
              
              if (distance > 500) {
                distanceWarning = `⚠️ Check-in suspeito: ${Math.round(distance)}m do local (máximo: 500m)`;
              }
            }
          }
        }
        
        const result = await db.updateAllocation(allocationId, {
          status: 'in_progress',
          checkInTime: new Date(),
          checkInLocation: location,
          workerSignatureIn: workerSignature,
          supervisorId: ctx.user?.id,
          ...benefits,
        });
        
        return {
          ...result,
          distanceWarning,
        };
      }),
    
    // Confirmar saída do trabalhador
    checkOut: protectedProcedure
      .input(z.object({
        allocationId: z.number(),
        workerSignature: z.string(),
        location: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { allocationId, workerSignature, location, notes } = input;
        
        // Buscar alocação para calcular pagamento
        const allocations = await db.getAllocations({});
        const allocation = allocations.find(a => a.id === allocationId);
        if (!allocation) {
          throw new Error('Alocação não encontrada');
        }
        
        const dailyRate = parseFloat(allocation.dailyRate || '0');
        const mealCost = allocation.tookMeal ? parseFloat(allocation.mealCost || '0') : 0;
        const netPay = dailyRate - mealCost;
        
        return await db.updateAllocation(allocationId, {
          status: 'completed',
          checkOutTime: new Date(),
          checkOutLocation: location,
          workerSignatureOut: workerSignature,
          netPay: netPay.toString(),
          notes: notes,
        });
      }),
  }),

  // ============================================================================
  // REPORTS (Relatórios)
  // ============================================================================
  reports: router({
    // Relatório quinzenal de pessoas-dia
    biweeklyReport: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
        period: z.enum(["first", "second"]), // primeira quinzena (1-15) ou segunda (16-fim)
        clientId: z.number().optional(), // filtro opcional por cliente
      }))
      .query(async ({ input }) => {
        return await db.getBiweeklyReport(input.year, input.month, input.period, input.clientId);
      }),
  }),

  // ============================================================================
  // WORKER REGISTRATION (Cadastro público de trabalhadores)
  // ============================================================================
  workerRegistration: router({
    // Upload de documento (público)
    uploadDocument: publicProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        
        // Converter base64 para buffer
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Upload para S3
        const { url } = await storagePut(
          `worker-docs/${input.fileName}`,
          buffer,
          input.mimeType
        );
        
        return { url };
      }),
    
    // Cadastro público - sem autenticação
    register: publicProcedure
      .input(z.object({
        fullName: z.string().min(3),
        cpf: z.string().length(11),
        dateOfBirth: z.string(), // YYYY-MM-DD
        motherName: z.string().min(3),
        phone: z.string(),
        email: z.string().email().optional(),
        street: z.string(),
        number: z.string(),
        complement: z.string().optional(),
        neighborhood: z.string(),
        city: z.string(),
        state: z.string().length(2),
        zipCode: z.string(),
        pixKey: z.string(),
        pixKeyType: z.enum(["cpf", "cnpj", "email", "phone", "random"]),
        documentPhotoUrl: z.string().url(),
        documentType: z.enum(["rg", "cnh", "rne"]),
        workerType: z.enum(["daily", "freelancer", "mei", "clt"]),
      }))
      .mutation(async ({ input }) => {
        // Validar idade (≥18 anos)
        const birthDate = new Date(input.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 18) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cadastro não permitido para menores de 18 anos",
          });
        }
        
        return await db.createWorkerRegistration(input);
      }),
    
    // Listar cadastros pendentes (admin only)
    listPending: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getPendingWorkerRegistrations();
      }),
    
    // Aprovar cadastro (admin only)
    approve: protectedProcedure
      .input(z.object({
        workerId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.approveWorkerRegistration(input.workerId, ctx.user.id);
      }),
    
    // Rejeitar cadastro (admin only)
    reject: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.rejectWorkerRegistration(input.workerId, input.reason);
      }),
  }),

  // ============================================================================
  // OPERATIONS
  // ============================================================================
  
  operations: router({
    // Criar operação (Admin only)
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        locationId: z.number(),
        contractId: z.number().nullable(),
        shiftId: z.number(),
        leaderId: z.number(),
        operationName: z.string(),
        workDate: z.string(),
        description: z.string().optional(),
        members: z.array(z.object({
          workerId: z.number(),
          jobFunction: z.string(),
          dailyRate: z.number(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem criar operações" });
        }
        
        return await db.createOperation({
          ...input,
          createdBy: ctx.user.id,
        });
      }),
    
    // Listar operações do líder
    listByLeader: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "leader" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        
        const leaderId = ctx.user.role === "admin" ? undefined : ctx.user.id;
        if (!leaderId && ctx.user.role === "leader") {
          return [];
        }
        
        return await db.getOperationsByLeader(leaderId || ctx.user.id);
      }),
    
    // Obter detalhes da operação
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const operation = await db.getOperationById(input.id);
        
        if (!operation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Operação não encontrada" });
        }
        
        // Verificar permissão
        if (ctx.user.role !== "admin" && ctx.user.role !== "leader") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        
        if (ctx.user.role === "leader" && operation.leaderId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não é o líder desta operação" });
        }
        
        return operation;
      }),
    
    // Aceitar participação (Trabalhador)
    accept: publicProcedure
      .input(z.object({
        memberId: z.number(),
        cpf: z.string(),
        ip: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.acceptOperation(input.memberId, input.cpf, input.ip);
      }),
    
    // Iniciar operação (Líder)
    start: protectedProcedure
      .input(z.object({ operationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "leader" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas líderes podem iniciar operações" });
        }
        
        return await db.startOperation(input.operationId, ctx.user.id);
      }),
    
    // Check-in de membro (Líder)
    checkIn: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "leader" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas líderes podem fazer check-in" });
        }
        
        return await db.checkInMember(input.memberId);
      }),
    
    // Check-out de membro (Líder)
    checkOut: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        tookMeal: z.boolean(),
        usedEpi: z.boolean(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "leader" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas líderes podem fazer check-out" });
        }
        
        return await db.checkOutMember(input.memberId, {
          tookMeal: input.tookMeal,
          usedEpi: input.usedEpi,
          notes: input.notes,
        });
      }),
    
    // Completar operação (Líder)
    complete: protectedProcedure
      .input(z.object({ operationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "leader" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas líderes podem completar operações" });
        }
        
        return await db.completeOperation(input.operationId, ctx.user.id);
      }),
    
    // Registrar ocorrência (Líder)
    createIncident: protectedProcedure
      .input(z.object({
        operationId: z.number(),
        memberId: z.number().optional(),
        incidentType: z.enum(["absence", "late_arrival", "early_departure", "misconduct", "accident", "equipment_issue", "quality_issue", "other"]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        description: z.string(),
        photos: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "leader" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas líderes podem registrar ocorrências" });
        }
        
        return await db.createOperationIncident({
          ...input,
          reportedBy: ctx.user.id,
        });
      }),
    
    // Listar ocorrências
    listIncidents: protectedProcedure
      .input(z.object({ operationId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "leader" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        
        return await db.getOperationIncidents(input.operationId);
      }),
  }),

  // ============================================================================
  // CONTROLE DE CONFORMIDADE
  // ============================================================================
  
  compliance: router({
    // Listar trabalhadores bloqueados
    listBlocked: protectedProcedure
      .query(async () => {
        return await db.getBlockedWorkers();
      }),
    
    // Obter histórico de bloqueios de um trabalhador
    getHistory: protectedProcedure
      .input(z.object({ workerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getWorkerBlockHistory(input.workerId);
      }),
    
    // Bloquear trabalhador manualmente
    blockWorker: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        reason: z.string(),
        blockType: z.enum(["temporary", "permanent"]),
        daysBlocked: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem bloquear trabalhadores" });
        }
        
        return await db.blockWorker({
          ...input,
          blockedBy: ctx.user.id,
        });
      }),
    
    // Desbloquear trabalhador
    unblockWorker: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem desbloquear trabalhadores" });
        }
        
        return await db.unblockWorker({
          ...input,
          unblockedBy: ctx.user.id,
        });
      }),
    
    // Obter métricas de conformidade
    getMetrics: protectedProcedure
      .query(async () => {
        return await db.getComplianceMetrics();
      }),
    
    // Verificar e desbloquear bloqueios expirados (cron job)
    checkExpiredBlocks: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        return await db.checkAndUnblockExpiredBlocks();
      }),

    // Calcular dias consecutivos de um trabalhador em um cliente
    getConsecutiveDays: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        clientId: z.number(),
      }))
      .query(async ({ input }) => {
        const consecutiveDays = await db.calculateConsecutiveDays(input.workerId, input.clientId);
        return {
          consecutiveDays,
          isAtRisk: consecutiveDays >= 2,
          isCritical: consecutiveDays >= 3,
          message: consecutiveDays >= 3
            ? "BLOQUEADO: Limite legal excedido"
            : consecutiveDays >= 2
            ? "ALERTA: Próximo do limite legal (2 dias)"
            : "OK",
        };
      }),

    // Verificar e bloquear por continuidade
    checkAndBlockByContinuity: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        clientId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.checkAndBlockByContinuity(
          input.workerId,
          input.clientId,
          ctx.user.id
        );
      }),

    // Registrar recusa de trabalho
    registerRefusal: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        operationId: z.number().optional(),
        clientId: z.number().optional(),
        refusalReason: z.string(),
        refusalType: z.enum(["scheduling_conflict", "distance", "rate_too_low", "personal_reasons", "already_working", "other"]),
        refusalDate: z.string(),
        evidence: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createWorkerRefusal({
          ...input,
          refusalDate: new Date(input.refusalDate),
          registeredBy: ctx.user.id,
        });
      }),

    // Listar recusas de um trabalhador
    getWorkerRefusals: protectedProcedure
      .input(z.object({ workerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getWorkerRefusals(input.workerId);
      }),

    // Obter métricas de autonomia de um trabalhador
    getWorkerAutonomy: protectedProcedure
      .input(z.object({ workerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getWorkerAutonomyMetrics(input.workerId);
      }),

    // Atualizar métricas de autonomia
    updateWorkerAutonomy: protectedProcedure
      .input(z.object({ workerId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.updateWorkerAutonomyMetrics(input.workerId);
      }),

    // Listar trabalhadores com baixa autonomia (admin only)
    getLowAutonomyWorkers: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getWorkersWithLowAutonomy();
      }),

    // Calcular riscos trabalhistas (admin only)
    calculateRisks: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.calculateWorkerRisks();
      }),

    // Obter estatísticas de risco (admin only)
    getRiskStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getRiskStatistics();
      }),
  }),
});

export type AppRouter = typeof appRouter;
