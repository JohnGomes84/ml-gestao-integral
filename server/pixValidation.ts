/**
 * Validação de chaves PIX conforme padrões do Banco Central
 */

export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random";

export interface PixValidationResult {
  isValid: boolean;
  type: PixKeyType | null;
  error?: string;
}

/**
 * Valida CPF
 */
function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCpf = cpf.replace(/\D/g, "");

  if (cleanCpf.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCpf.charAt(9))) return false;

  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCpf.charAt(10))) return false;

  return true;
}

/**
 * Valida CNPJ
 */
function isValidCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/\D/g, "");

  if (cnpj.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  // Valida primeiro dígito verificador
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cnpj.charAt(12))) return false;

  // Valida segundo dígito verificador
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cnpj.charAt(13))) return false;

  return true;
}

/**
 * Valida email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 77; // Limite do Banco Central
}

/**
 * Valida telefone (formato E.164)
 */
function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, "");

  // Formato com DDI +55: 55 + DDD + número (9 dígitos móvel ou 8 fixo)
  if (cleanPhone.startsWith("55")) {
    const local = cleanPhone.slice(2);
    return /^[1-9]{2}(9\d{8}|[2-5]\d{7})$/.test(local);
  }

  // Formato nacional: DDD + número
  return /^[1-9]{2}(9\d{8}|[2-5]\d{7})$/.test(cleanPhone);
}

/**
 * Valida chave aleatória (formato UUID v4)
 */
function isValidRandomKey(key: string): boolean {
  // Chave aleatória do PIX tem 32 caracteres alfanuméricos
  const randomKeyRegex =
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  return randomKeyRegex.test(key) || /^[a-zA-Z0-9]{32}$/.test(key);
}

/**
 * Detecta e valida chave PIX
 */
export function validatePixKey(key: string): PixValidationResult {
  if (!key || key.trim() === "") {
    return {
      isValid: false,
      type: null,
      error: "Chave PIX não pode estar vazia",
    };
  }

  key = key.trim();

  // Remove formatação comum
  const cleanKey = key.replace(/\D/g, "");

  // Tenta identificar o tipo de chave
  // IMPORTANTE: Ordem importa! CPF/CNPJ devem ser verificados antes de telefone

  // Email (tem @, então é fácil identificar primeiro)
  if (key.includes("@") && isValidEmail(key)) {
    return {
      isValid: true,
      type: "email",
    };
  }

  // CNPJ (14 dígitos) - verificar antes de telefone
  if (cleanKey.length === 14 && isValidCNPJ(cleanKey)) {
    return {
      isValid: true,
      type: "cnpj",
    };
  }

  // CPF (11 dígitos) - verificar antes de telefone
  if (cleanKey.length === 11) {
    if (isValidCPF(cleanKey)) {
      return {
        isValid: true,
        type: "cpf",
      };
    }
    // Se tem 11 dígitos mas não é CPF válido, pode ser telefone
    if (isValidPhone(key)) {
      return {
        isValid: true,
        type: "phone",
      };
    }
    // Se não é nem CPF nem telefone válido, é inválido
    return {
      isValid: false,
      type: null,
      error: "CPF inválido",
    };
  }

  // Telefone (10, 12 ou 13 dígitos)
  if (
    (cleanKey.length === 10 ||
      cleanKey.length === 12 ||
      cleanKey.length === 13) &&
    isValidPhone(key)
  ) {
    return {
      isValid: true,
      type: "phone",
    };
  }

  // Chave aleatória
  if (isValidRandomKey(key)) {
    return {
      isValid: true,
      type: "random",
    };
  }

  return {
    isValid: false,
    type: null,
    error:
      "Chave PIX inválida. Use CPF, CNPJ, Email, Telefone ou Chave Aleatória válidos.",
  };
}

/**
 * Formata chave PIX para exibição
 */
export function formatPixKey(key: string, type: PixKeyType): string {
  switch (type) {
    case "cpf":
      const cpf = key.replace(/\D/g, "");
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    case "cnpj":
      const cnpj = key.replace(/\D/g, "");
      return cnpj.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );

    case "phone":
      const phone = key.replace(/\D/g, "");
      if (phone.length === 11) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      } else if (phone.length === 10) {
        return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
      }
      return key;

    case "email":
    case "random":
    default:
      return key;
  }
}
