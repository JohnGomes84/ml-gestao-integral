import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Worker Registration", () => {
  let testClientId: number;
  const timestamp = Date.now().toString().slice(-8); // Últimos 8 dígitos do timestamp

  beforeAll(async () => {
    // Criar cliente de teste
    const testClient = await db.createClient({
      companyName: "Test Client for Worker Registration",
      contactName: "Test Contact",
      contactEmail: "test@example.com",
      contactPhone: "11999999999",
    });
    testClientId = testClient.id;
  });

  it("should register a new worker with all required fields", async () => {
    const caller = appRouter.createCaller({ user: null });

    const workerData = {
      fullName: "João da Silva",
      cpf: `111${timestamp}`,  // CPF único baseado em timestamp
      dateOfBirth: "1990-01-15",
      motherName: "Maria da Silva",
      phone: "11987654321",
      email: "joao@example.com",
      street: "Rua Teste",
      number: "123",
      complement: "Apto 45",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
      pixKey: `111${timestamp}`,
      pixKeyType: "cpf" as const,
      documentType: "rg" as const,
      documentPhotoUrl: "https://example.com/doc.jpg",
      workerType: "daily" as const,
    };

    const result = await caller.workerRegistration.register(workerData);

    expect(result).toBeDefined();
    // A API retorna o objeto do trabalhador criado
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("cpf");
    expect(result.registrationStatus).toBe("pending");
  });

  it("should reject registration of underage worker", async () => {
    const caller = appRouter.createCaller({ user: null });

    const underageDate = new Date();
    underageDate.setFullYear(underageDate.getFullYear() - 17); // 17 anos

    const workerData = {
      fullName: "Menor de Idade",
      cpf: "98765432109",
      dateOfBirth: underageDate.toISOString().split('T')[0],
      motherName: "Mãe do Menor",
      phone: "11987654321",
      email: "menor@example.com",
      street: "Rua Teste",
      number: "123",
      complement: "",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
      pixKey: "98765432109",
      pixKeyType: "cpf" as const,
      documentType: "rg" as const,
      documentPhotoUrl: "https://example.com/doc.jpg",
      workerType: "daily" as const,
    };

    await expect(
      caller.workerRegistration.register(workerData)
    ).rejects.toThrow("18 anos");
  });

  it("should list pending worker registrations (admin only)", async () => {
    // Criar usuário admin de teste
    const adminUser = {
      id: 1,
      openId: "test-admin",
      name: "Admin User",
      email: "admin@test.com",
      role: "admin" as const,
      createdAt: new Date(),
    };

    const caller = appRouter.createCaller({ user: adminUser });

    const result = await caller.workerRegistration.listPending();

    expect(Array.isArray(result)).toBe(true);
    // Deve ter pelo menos o trabalhador que registramos no primeiro teste
    expect(result.length).toBeGreaterThan(0);
  });

  it("should approve worker registration (admin only)", async () => {
    const adminUser = {
      id: 1,
      openId: "test-admin",
      name: "Admin User",
      email: "admin@test.com",
      role: "admin" as const,
      createdAt: new Date(),
    };

    const caller = appRouter.createCaller({ user: adminUser });

    // Pegar primeiro trabalhador pendente
    const pending = await caller.workerRegistration.listPending();
    if (pending.length === 0) {
      throw new Error("No pending workers to approve");
    }

    const workerId = pending[0].id;

    const result = await caller.workerRegistration.approve({ workerId });

    expect(result).toBeDefined();
    // A API retorna o objeto do trabalhador aprovado
    expect(result).toHaveProperty("id");
  });

  it("should reject worker registration with reason (admin only)", async () => {
    // Primeiro registrar um novo trabalhador para rejeitar
    const publicCaller = appRouter.createCaller({ user: null });

    await publicCaller.workerRegistration.register({
      fullName: "Trabalhador Para Rejeitar",
      cpf: `222${timestamp}`,  // CPF único baseado em timestamp
      dateOfBirth: "1985-05-20",
      motherName: "Mãe do Trabalhador",
      phone: "11987654321",
      email: "rejeitar@example.com",
      street: "Rua Teste",
      number: "456",
      complement: "",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
      pixKey: `222${timestamp}`,
      pixKeyType: "cpf" as const,
      documentType: "rg" as const,
      documentPhotoUrl: "https://example.com/doc.jpg",
      workerType: "daily" as const,
    });

    // Agora rejeitar como admin
    const adminUser = {
      id: 1,
      openId: "test-admin",
      name: "Admin User",
      email: "admin@test.com",
      role: "admin" as const,
      createdAt: new Date(),
    };

    const adminCaller = appRouter.createCaller({ user: adminUser });

    const pending = await adminCaller.workerRegistration.listPending();
    const workerToReject = pending.find(w => w.cpf === `222${timestamp}`);

    if (!workerToReject) {
      throw new Error("Worker to reject not found");
    }

    const result = await adminCaller.workerRegistration.reject({
      workerId: workerToReject.id,
      reason: "Documento ilegível",
    });

    expect(result).toBeDefined();
    // A API retorna o objeto do trabalhador rejeitado
    expect(result).toHaveProperty("id");
  });
});
