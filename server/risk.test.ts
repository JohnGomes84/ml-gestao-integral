import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { workers, clients, operations, operationMembers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Risk Dashboard Tests", () => {
  let testClientId: number;
  let testWorkerId1: number;
  let testWorkerId2: number;
  let testWorkerId3: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Create test client
    const clientResult = await db
      .insert(clients)
      .values({
        companyName: `Test Client Risk ${Date.now()}`,
        cnpj: `12345678000${Date.now().toString().slice(-3)}`,
        contactName: "Test Contact",
        contactPhone: "11999999999",
        status: "active",
      });
    testClientId = Number((Array.isArray(clientResult) ? clientResult[0] : clientResult).insertId);

    // Create test workers
    const timestamp = Date.now();
    const worker1Result = await db
      .insert(workers)
      .values({
        fullName: "Worker High Risk",
        cpf: `111${timestamp.toString().slice(-8)}`,
        dateOfBirth: new Date("1990-01-01"),
        phone: "11999999991",
        motherName: "Mother 1",
        email: `worker1.${timestamp}@test.com`,
        street: "Street 1",
        number: "100",
        neighborhood: "Neighborhood 1",
        city: "City 1",
        state: "SP",
        zipCode: "01000-000",
        pixKey: `111${timestamp.toString().slice(-8)}`,
        pixKeyType: "cpf",
        documentPhotoUrl: "https://example.com/doc1.jpg",
        documentType: "rg",
        registrationStatus: "approved",
        status: "active",
      });
    testWorkerId1 = Number((Array.isArray(worker1Result) ? worker1Result[0] : worker1Result).insertId);

    const worker2Result = await db
      .insert(workers)
      .values({
        fullName: "Worker Medium Risk",
        cpf: `222${timestamp.toString().slice(-8)}`,
        dateOfBirth: new Date("1992-01-01"),
        phone: "11999999992",
        motherName: "Mother 2",
        email: `worker2.${timestamp}@test.com`,
        street: "Street 2",
        number: "200",
        neighborhood: "Neighborhood 2",
        city: "City 2",
        state: "SP",
        zipCode: "02000-000",
        pixKey: `222${timestamp.toString().slice(-8)}`,
        pixKeyType: "cpf",
        documentPhotoUrl: "https://example.com/doc2.jpg",
        documentType: "rg",
        registrationStatus: "approved",
        status: "active",
      });
    testWorkerId2 = Number((Array.isArray(worker2Result) ? worker2Result[0] : worker2Result).insertId);

    const worker3Result = await db
      .insert(workers)
      .values({
        fullName: "Worker Low Risk",
        cpf: `333${timestamp.toString().slice(-8)}`,
        dateOfBirth: new Date("1995-01-01"),
        phone: "11999999993",
        motherName: "Mother 3",
        email: `worker3.${timestamp}@test.com`,
        street: "Street 3",
        number: "300",
        neighborhood: "Neighborhood 3",
        city: "City 3",
        state: "SP",
        zipCode: "03000-000",
        pixKey: `333${timestamp.toString().slice(-8)}`,
        pixKeyType: "cpf",
        documentPhotoUrl: "https://example.com/doc3.jpg",
        documentType: "rg",
        registrationStatus: "approved",
        status: "active",
      });
    testWorkerId3 = Number((Array.isArray(worker3Result) ? worker3Result[0] : worker3Result).insertId);

    // Create test location first
    const { workLocations } = await import("../drizzle/schema");
    const locationResult = await db
      .insert(workLocations)
      .values({
        clientId: testClientId,
        locationName: "Test Location",
        address: "Test Address",
        city: "Test City",
        state: "SP",
        zipCode: "01000-000",
        status: "active",
      });
    const testLocationId = Number((Array.isArray(locationResult) ? locationResult[0] : locationResult).insertId);

    // Create operations to simulate consecutive days
    const today = new Date();
    
    // Worker 1: 5 consecutive days (HIGH RISK)
    for (let i = 4; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const operationResult = await db
        .insert(operations)
        .values({
          clientId: testClientId,
          locationId: testLocationId,
          operationName: "Test Operation",
          workDate: date,
          shiftId: 1,
          leaderId: 1,
          createdBy: 1,
          status: "completed",
        });
      const operationId = Number((Array.isArray(operationResult) ? operationResult[0] : operationResult).insertId);

      await db.insert(operationMembers).values({
        operationId: operationId,
        workerId: testWorkerId1,
        jobFunction: "Auxiliar de Carga",
        dailyRate: "150.00",
        status: "completed",
        acceptedAt: date,
        checkInTime: date,
        checkOutTime: new Date(date.getTime() + 8 * 60 * 60 * 1000),
      });
    }

    // Worker 2: 2 consecutive days (MEDIUM RISK)
    for (let i = 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const operationResult = await db
        .insert(operations)
        .values({
          clientId: testClientId,
          locationId: testLocationId,
          operationName: "Test Operation",
          workDate: date,
          shiftId: 1,
          leaderId: 1,
          createdBy: 1,
          status: "completed",
        });
      const operationId = Number((Array.isArray(operationResult) ? operationResult[0] : operationResult).insertId);

      await db.insert(operationMembers).values({
        operationId: operationId,
        workerId: testWorkerId2,
        jobFunction: "Auxiliar de Carga",
        dailyRate: "150.00",
        status: "completed",
        acceptedAt: date,
        checkInTime: date,
        checkOutTime: new Date(date.getTime() + 8 * 60 * 60 * 1000),
      });
    }

    // Worker 3: 1 day only (LOW RISK)
    const operation3Result = await db
      .insert(operations)
      .values({
        clientId: testClientId,
        locationId: testLocationId,
        operationName: "Test Operation",
        workDate: today,
        shiftId: 1,
        leaderId: 1,
        createdBy: 1,
        status: "completed",
      });
    const operation3Id = Number((Array.isArray(operation3Result) ? operation3Result[0] : operation3Result).insertId);

    await db.insert(operationMembers).values({
      operationId: operation3Id,
      workerId: testWorkerId3,
      jobFunction: "Auxiliar de Carga",
      dailyRate: "150.00",
      status: "completed",
      acceptedAt: today,
      checkInTime: today,
      checkOutTime: new Date(today.getTime() + 8 * 60 * 60 * 1000),
    });
  });

  it("should calculate consecutive days correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { calculateConsecutiveDays } = await import("./db");
    
    const worker1Days = await calculateConsecutiveDays(testWorkerId1, testClientId);
    const worker2Days = await calculateConsecutiveDays(testWorkerId2, testClientId);
    const worker3Days = await calculateConsecutiveDays(testWorkerId3, testClientId);

    expect(worker1Days).toBe(5);
    expect(worker2Days).toBe(2);
    expect(worker3Days).toBe(1);
  });

  it("should classify risk levels correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { calculateConsecutiveDays } = await import("./db");
    
    const worker1Days = await calculateConsecutiveDays(testWorkerId1, testClientId);
    const worker2Days = await calculateConsecutiveDays(testWorkerId2, testClientId);
    const worker3Days = await calculateConsecutiveDays(testWorkerId3, testClientId);

    // Risk classification logic:
    // >= 5 days = HIGH
    // 3-4 days = MEDIUM
    // < 3 days = LOW
    
    const getRiskLevel = (days: number) => {
      if (days >= 5) return "HIGH";
      if (days >= 3) return "MEDIUM";
      return "LOW";
    };

    expect(getRiskLevel(worker1Days)).toBe("HIGH");
    expect(getRiskLevel(worker2Days)).toBe("LOW"); // 2 days is still low
    expect(getRiskLevel(worker3Days)).toBe("LOW");
  });

  it("should calculate financial exposure correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { calculateConsecutiveDays } = await import("./db");
    
    const worker1Days = await calculateConsecutiveDays(testWorkerId1, testClientId);
    const averageDailyRate = 150; // Example daily rate
    
    const financialExposure = worker1Days * averageDailyRate;
    
    expect(financialExposure).toBe(750); // 5 days × R$ 150
  });

  it("should return workers at risk for a specific client", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { calculateConsecutiveDays } = await import("./db");
    
    // Get all workers
    const allWorkers = await db
      .select()
      .from(workers)
      .where(eq(workers.status, "active"));

    const workersAtRisk = [];
    
    for (const worker of allWorkers) {
      const consecutiveDays = await calculateConsecutiveDays(worker.id, testClientId);
      if (consecutiveDays >= 3) {
        workersAtRisk.push({
          workerId: worker.id,
          workerName: worker.fullName,
          consecutiveDays,
        });
      }
    }

    // Only worker1 should be at risk (5 days >= 3)
    expect(workersAtRisk.length).toBeGreaterThanOrEqual(1);
    const worker1Risk = workersAtRisk.find(w => w.workerId === testWorkerId1);
    expect(worker1Risk).toBeDefined();
    expect(worker1Risk?.consecutiveDays).toBe(5);
  });

  it("should handle workers with no operations", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { calculateConsecutiveDays } = await import("./db");
    
    // Create a worker with no operations
    const timestamp = Date.now();
    const newWorkerResult = await db
      .insert(workers)
      .values({
        fullName: "Worker No Operations",
        cpf: `999${timestamp.toString().slice(-8)}`,
        dateOfBirth: new Date("1993-01-01"),
        phone: "11999999999",
        motherName: "Mother Test",
        email: `noops.${timestamp}@test.com`,
        street: "Street Test",
        number: "999",
        neighborhood: "Neighborhood Test",
        city: "City Test",
        state: "SP",
        zipCode: "09000-000",
        pixKey: `999${timestamp.toString().slice(-8)}`,
        pixKeyType: "cpf",
        documentPhotoUrl: "https://example.com/doc.jpg",
        documentType: "rg",
        registrationStatus: "approved",
        status: "active",
      });
    const newWorkerId = Number((Array.isArray(newWorkerResult) ? newWorkerResult[0] : newWorkerResult).insertId);

    const consecutiveDays = await calculateConsecutiveDays(newWorkerId, testClientId);
    
    expect(consecutiveDays).toBe(0);
  });
});
