// @ts-nocheck
import { describe, it, expect } from "vitest";
import { validatePixKey, formatPixKey } from "./pixValidation";

describe("PIX Key Validation", () => {
  describe("CPF validation", () => {
    it("should validate correct CPF", () => {
      const result = validatePixKey("12345678909");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("cpf");
    });

    it("should validate formatted CPF", () => {
      const result = validatePixKey("123.456.789-09");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("cpf");
    });

    it("should reject invalid CPF", () => {
      const result = validatePixKey("12345678901"); // Invalid check digits
      expect(result.isValid).toBe(false);
    });

    it("should reject CPF with all same digits", () => {
      const result = validatePixKey("00000000000");
      expect(result.isValid).toBe(false);
    });
  });

  describe("CNPJ validation", () => {
    it("should validate correct CNPJ", () => {
      const result = validatePixKey("11222333000181");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("cnpj");
    });

    it("should reject invalid CNPJ", () => {
      const result = validatePixKey("11222333000180");
      expect(result.isValid).toBe(false);
    });
  });

  describe("Email validation", () => {
    it("should validate correct email", () => {
      const result = validatePixKey("usuario@exemplo.com");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("email");
    });

    it("should reject invalid email", () => {
      const result = validatePixKey("usuario@");
      expect(result.isValid).toBe(false);
    });

    it("should reject email longer than 77 characters", () => {
      const longEmail = "a".repeat(70) + "@test.com";
      const result = validatePixKey(longEmail);
      expect(result.isValid).toBe(false);
    });
  });

  describe("Phone validation", () => {
    it("should validate Brazilian mobile phone", () => {
      const result = validatePixKey("11999999999");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("phone");
    });

    it("should validate formatted phone", () => {
      const result = validatePixKey("(11) 99999-9999");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("phone");
    });

    it("should validate phone with country code", () => {
      const result = validatePixKey("5511999999999");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("phone");
    });
  });

  describe("Random key validation", () => {
    it("should validate UUID format", () => {
      const result = validatePixKey("550e8400-e29b-41d4-a716-446655440000");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("random");
    });

    it("should validate 32-character alphanumeric", () => {
      const result = validatePixKey("a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("random");
    });
  });

  describe("Edge cases", () => {
    it("should reject empty string", () => {
      const result = validatePixKey("");
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject whitespace only", () => {
      const result = validatePixKey("   ");
      expect(result.isValid).toBe(false);
    });
  });

  describe("PIX key formatting", () => {
    it("should format CPF correctly", () => {
      const formatted = formatPixKey("12345678909", "cpf");
      expect(formatted).toBe("123.456.789-09");
    });

    it("should format CNPJ correctly", () => {
      const formatted = formatPixKey("11222333000181", "cnpj");
      expect(formatted).toBe("11.222.333/0001-81");
    });

    it("should format mobile phone correctly", () => {
      const formatted = formatPixKey("11999999999", "phone");
      expect(formatted).toBe("(11) 99999-9999");
    });

    it("should not format email", () => {
      const email = "test@example.com";
      const formatted = formatPixKey(email, "email");
      expect(formatted).toBe(email);
    });
  });
});
