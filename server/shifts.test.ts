import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { clients } from "../drizzle/schema";

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

describe("Shifts Management", () => {
  let testClientId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test client
    const result = await db
      .insert(clients)
      .values({
        companyName: "Test Client for Shifts",
        cnpj: "12345678000199",
        contactName: "Test Contact",
        contactEmail: "test@shifts.com",
        contactPhone: "11999999999",
        address: "Test Address",
        city: "São Paulo",
        state: "SP",
        zipCode: "01000-000",
        latitude: -23.5505,
        longitude: -46.6333,
        status: "active",
      });

    // MySQL doesn't support returning(), so we get the insertId
    // Result is an array [ResultSetHeader, undefined]
    const insertResult = Array.isArray(result) ? result[0] : result;
    testClientId = Number(insertResult.insertId);
    
    if (isNaN(testClientId) || testClientId === 0) {
      throw new Error(`Failed to create test client: invalid ID (got ${testClientId})`);
    }
  });

  it("should create, list, update and delete shifts", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // 1. Create a shift
    const shift = await caller.shifts.create({
      clientId: testClientId,
      shiftName: "Turno Manhã",
      shiftType: "morning",
      startTime: "06:00",
      endTime: "14:00",
      description: "Turno da manhã - 6h às 14h",
    });

    expect(shift).toBeDefined();
    expect(shift.shiftName).toBe("Turno Manhã");
    expect(shift.startTime).toBe("06:00");
    expect(shift.endTime).toBe("14:00");
    expect(shift.clientId).toBe(testClientId);
    expect(shift.status).toBe("active");

    const shiftId = shift.id;

    // 2. Create another shift
    const shift2 = await caller.shifts.create({
      clientId: testClientId,
      shiftName: "Turno Tarde",
      shiftType: "afternoon",
      startTime: "14:00",
      endTime: "22:00",
      description: "Turno da tarde - 14h às 22h",
    });

    expect(shift2).toBeDefined();

    // 3. List all shifts
    const shiftsList = await caller.shifts.list();
    expect(shiftsList).toBeDefined();
    expect(shiftsList.length).toBeGreaterThanOrEqual(2);

    // 4. Update the first shift
    const updated = await caller.shifts.update({
      id: shiftId,
      clientId: testClientId,
      shiftName: "Turno Manhã Atualizado",
      shiftType: "morning",
      startTime: "07:00",
      endTime: "15:00",
      description: "Turno da manhã atualizado - 7h às 15h",
    });

    expect(updated).toBeDefined();
    expect(updated.shiftName).toBe("Turno Manhã Atualizado");
    expect(updated.startTime).toBe("07:00");
    expect(updated.endTime).toBe("15:00");

    // 5. Delete the shift
    await caller.shifts.delete({
      id: shiftId,
    });

    // Verify it's deleted
    const shiftsAfterDelete = await caller.shifts.list();
    const deletedShift = shiftsAfterDelete.find((s) => s.id === shiftId);
    expect(deletedShift).toBeUndefined();
  });

  it("should validate shift time format", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // This should work with HH:mm format
    const validShift = await caller.shifts.create({
      clientId: testClientId,
      shiftName: "Turno Noite",
      shiftType: "night",
      startTime: "22:00",
      endTime: "06:00",
      description: "Turno da noite",
    });

    expect(validShift).toBeDefined();
    expect(validShift.startTime).toBe("22:00");
    expect(validShift.endTime).toBe("06:00");
  });
});
