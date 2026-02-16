// @ts-nocheck
import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routes/routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import {
  clients,
  workers,
  workLocations,
  shifts,
  allocations,
} from "../drizzle/schema";

function createTestContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Biweekly Report", () => {
  let hasDatabase = true;
  let testClientId: number;
  let testWorkerId: number;
  let testLocationId: number;
  let testShiftId: number;

  beforeAll(async () => {
    if (!hasDatabase) return;
    const db = await getDb();
    if (!db) {
      hasDatabase = false;
      return;
    }

    // Create test client
    const clientResult = await db.insert(clients).values({
      companyName: "Test Client for Report",
      cnpj: "12345678000188",
      contactName: "Test Contact",
      contactEmail: "test@report.com",
      contactPhone: "11999999999",
      address: "Test Address",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000-000",
      latitude: -23.5505,
      longitude: -46.6333,
      status: "active",
    });
    testClientId = Number(
      (Array.isArray(clientResult) ? clientResult[0] : clientResult).insertId
    );

    // Create test worker with unique CPF
    const uniqueCpf = `999${Date.now().toString().slice(-8)}`;
    const workerResult = await db.insert(workers).values({
      fullName: "Test Worker Report",
      cpf: uniqueCpf,
      phone: "11999999999",
      workerType: "daily",
      status: "active",
    });
    testWorkerId = Number(
      (Array.isArray(workerResult) ? workerResult[0] : workerResult).insertId
    );

    // Create test location
    const locationResult = await db.insert(workLocations).values({
      clientId: testClientId,
      locationName: "Test Location Report",
      address: "Test Address",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000-000",
      status: "active",
    });
    testLocationId = Number(
      (Array.isArray(locationResult) ? locationResult[0] : locationResult)
        .insertId
    );

    // Create test shift
    const shiftResult = await db.insert(shifts).values({
      clientId: testClientId,
      shiftName: "Turno Teste",
      startTime: "08:00",
      endTime: "17:00",
      description: "Turno de teste",
      status: "active",
    });
    testShiftId = Number(
      (Array.isArray(shiftResult) ? shiftResult[0] : shiftResult).insertId
    );

    // Create test allocations with check-in
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // Create allocations in the first half of the current month
    for (let day = 1; day <= 3; day++) {
      const workDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      await db.insert(allocations).values({
        workerId: testWorkerId,
        clientId: testClientId,
        locationId: testLocationId,
        shiftId: testShiftId,
        workDate: workDate,
        status: "completed",
        checkInTime: new Date(`${workDate}T08:00:00`),
        checkOutTime: new Date(`${workDate}T17:00:00`),
        dailyRate: "150.00",
        tookMeal: day % 2 === 0, // Alternate meal taking
        mealCost: "25.00",
        netPay: day % 2 === 0 ? "125.00" : "150.00",
      });
    }
  });

  it("should generate biweekly report with correct data", async () => {
    if (!hasDatabase) return;
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const report = await caller.reports.biweeklyReport({
      year,
      month,
      period: "first",
    });

    expect(report).toBeDefined();
    expect(report.period).toBeDefined();
    expect(report.period?.year).toBe(year);
    expect(report.period?.month).toBe(month);
    expect(report.period?.period).toBe("first");

    // Should have summary data
    expect(report.summary).toBeDefined();
    expect(Array.isArray(report.summary)).toBe(true);

    // Should have details data
    expect(report.details).toBeDefined();
    expect(Array.isArray(report.details)).toBe(true);

    // Should have at least 3 allocations we created
    expect(report.totalPersonDays).toBeGreaterThanOrEqual(3);
  });

  it("should group data by client and shift", async () => {
    if (!hasDatabase) return;
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const report = await caller.reports.biweeklyReport({
      year,
      month,
      period: "first",
    });

    // Find our test client in the summary
    const testClientSummary = report.summary.find(
      s => s.clientId === testClientId
    );

    expect(testClientSummary).toBeDefined();
    expect(testClientSummary?.totalPersonDays).toBeGreaterThanOrEqual(3);
    expect(testClientSummary?.shifts).toBeDefined();
    expect(testClientSummary?.shifts.length).toBeGreaterThan(0);

    // Check shift data
    const testShiftData = testClientSummary?.shifts.find(
      s => s.shiftId === testShiftId
    );
    expect(testShiftData).toBeDefined();
    expect(testShiftData?.personDays).toBeGreaterThanOrEqual(3);
  });

  it("should return empty report for period with no allocations", async () => {
    if (!hasDatabase) return;
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Query a future period that has no data
    const report = await caller.reports.biweeklyReport({
      year: 2030,
      month: 12,
      period: "second",
    });

    expect(report).toBeDefined();
    expect(report.summary.length).toBe(0);
    expect(report.details.length).toBe(0);
    expect(report.totalPersonDays).toBe(0);
  });

  it("should filter report by specific client", async () => {
    if (!hasDatabase) return;
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // Query with specific client filter
    const report = await caller.reports.biweeklyReport({
      year,
      month,
      period: "first",
      clientId: testClientId,
    });

    expect(report).toBeDefined();
    expect(report.summary.length).toBeGreaterThan(0);

    // All results should be for the filtered client
    for (const client of report.summary) {
      expect(client.clientId).toBe(testClientId);
    }

    for (const detail of report.details) {
      expect(detail.clientId).toBe(testClientId);
    }
  });
});
