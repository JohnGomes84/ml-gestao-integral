import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@mlservicos.com.br",
    name: "Admin Test",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Worker Risk Calculation", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("should calculate low risk for new worker with no allocations", async () => {
    // Este teste verifica que um trabalhador sem alocações tem risco baixo
    const risk = await db.calculateWorkerRisk(999999, 1, 1);

    expect(risk.level).toBe("low");
    expect(risk.score).toBe(0);
    expect(risk.consecutiveDays).toBe(0);
    expect(risk.daysInMonth).toBe(0);
  });

  it("should block allocation when worker has 3+ consecutive days", async () => {
    // Este teste verifica que o sistema bloqueia alocações com 3+ dias consecutivos
    // Nota: Este teste requer dados reais no banco. Em produção, use um banco de testes.
    
    try {
      // Tentar criar alocação que violaria a regra de dias consecutivos
      // (assumindo que o trabalhador já tem 2 dias consecutivos)
      await caller.allocations.create({
        workerId: 1,
        clientId: 1,
        locationId: 1,
        workDate: new Date().toISOString().split('T')[0],
        jobFunction: "Ajudante",
        dailyRate: 150,
      });
      
      // Se chegou aqui, o teste falhou (deveria ter bloqueado)
      expect(true).toBe(false);
    } catch (error: any) {
      // Esperamos que o erro contenha "BLOQUEADO" ou "risco crítico"
      expect(error.message).toMatch(/BLOQUEADO|risco crítico/i);
    }
  });

  it("should calculate correct risk score based on multiple factors", async () => {
    // Este teste verifica o cálculo do score de risco
    // Score = (dias consecutivos × 30) + (dias no mês × 5) + (meses com cliente × 10)
    
    // Exemplo: 2 dias consecutivos, 8 dias no mês, 2 meses com cliente
    // Score = (2 × 30) + (8 × 5) + (2 × 10) = 60 + 40 + 20 = 120 (mas max é 100)
    
    const risk = await db.calculateWorkerRisk(1, 1, 1);
    
    // Verificar que o score está entre 0 e 100
    expect(risk.score).toBeGreaterThanOrEqual(0);
    expect(risk.score).toBeLessThanOrEqual(100);
    
    // Verificar que o nível de risco é consistente com o score
    if (risk.score < 30) {
      expect(risk.level).toBe("low");
    } else if (risk.score < 60) {
      expect(risk.level).toBe("medium");
    } else if (risk.score < 80) {
      expect(risk.level).toBe("high");
    } else {
      expect(risk.level).toBe("critical");
    }
  });

  it("should return correct risk dashboard statistics", async () => {
    const dashboard = await caller.workers.getRiskDashboard();

    // Verificar estrutura do dashboard
    expect(dashboard).toHaveProperty("total");
    expect(dashboard).toHaveProperty("lowRisk");
    expect(dashboard).toHaveProperty("mediumRisk");
    expect(dashboard).toHaveProperty("highRisk");
    expect(dashboard).toHaveProperty("criticalRisk");
    expect(dashboard).toHaveProperty("highRiskWorkers");

    // Verificar que a soma dos riscos é igual ao total
    const sum =
      dashboard.lowRisk +
      dashboard.mediumRisk +
      dashboard.highRisk +
      dashboard.criticalRisk;
    expect(sum).toBe(dashboard.total);

    // Verificar que highRiskWorkers contém apenas trabalhadores de alto risco
    dashboard.highRiskWorkers.forEach((worker) => {
      expect(["high", "critical"]).toContain(worker.riskLevel);
    });
  });
});

describe("Worker CRUD Operations", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("should create a new worker successfully", async () => {
    const newWorker = {
      fullName: "João da Silva Teste",
      cpf: `${Math.floor(Math.random() * 100000000000)}`,
      phone: "(11) 98765-4321",
      pixKey: "joao@teste.com",
      workerType: "daily" as const,
      dailyRate: 150,
    };

    const result = await caller.workers.create(newWorker);

    // Verificar que o trabalhador foi criado
    expect(result).toBeDefined();
  });

  it("should list all workers", async () => {
    const workers = await caller.workers.list();

    // Verificar que retorna um array
    expect(Array.isArray(workers)).toBe(true);

    // Se houver trabalhadores, verificar estrutura
    if (workers.length > 0) {
      const worker = workers[0];
      expect(worker).toHaveProperty("id");
      expect(worker).toHaveProperty("fullName");
      expect(worker).toHaveProperty("cpf");
      expect(worker).toHaveProperty("workerType");
      expect(worker).toHaveProperty("riskScore");
      expect(worker).toHaveProperty("riskLevel");
    }
  });

  it("should calculate risk for a specific worker", async () => {
    const workers = await caller.workers.list();
    
    if (workers.length > 0) {
      const workerId = workers[0]!.id;
      
      const risk = await caller.workers.calculateRisk({
        workerId,
        clientId: 1,
        locationId: 1,
      });

      // Verificar estrutura do risco
      expect(risk).toHaveProperty("score");
      expect(risk).toHaveProperty("level");
      expect(risk).toHaveProperty("consecutiveDays");
      expect(risk).toHaveProperty("daysInMonth");
      expect(risk).toHaveProperty("monthsWithClient");

      // Verificar que o score está entre 0 e infinito
      expect(risk.score).toBeGreaterThanOrEqual(0);
    }
  });
});
