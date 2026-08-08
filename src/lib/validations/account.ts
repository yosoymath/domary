import { z } from "zod";
import { PASSWORD_LETTER_PATTERN, PASSWORD_MIN_LENGTH, PASSWORD_NUMBER_PATTERN } from "@/lib/password-policy";

export const genderValues = [
  "FEMALE",
  "MALE",
  "NON_BINARY",
  "OTHER",
  "PREFER_NOT_TO_SAY",
] as const;

const brazilianStates = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT",
  "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO",
  "RR", "SC", "SP", "SE", "TO",
]);

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string) {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  for (let digitIndex = 9; digitIndex < 11; digitIndex += 1) {
    let sum = 0;
    for (let index = 0; index < digitIndex; index += 1) {
      sum += Number(cpf[index]) * (digitIndex + 1 - index);
    }
    const checkDigit = ((sum * 10) % 11) % 10;
    if (checkDigit !== Number(cpf[digitIndex])) return false;
  }

  return true;
}

function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;

  const today = new Date();
  const todayValue = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const oldestValue = Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate());
  return date.getTime() <= todayValue && date.getTime() >= oldestValue;
}

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(80, "O nome deve ter no máximo 80 caracteres."),
  email: z.string().trim().min(1, "Informe seu e-mail.").max(254, "O e-mail é muito longo.").email("Informe um e-mail válido.").transform((email) => email.toLowerCase()),
  phone: z.string().trim().refine((value) => {
    if (!value) return true;
    const digits = onlyDigits(value);
    return digits.length === 10 || digits.length === 11;
  }, "Informe um telefone válido com DDD."),
  cpf: z.string().trim().refine((value) => !value || isValidCpf(value), "Informe um CPF válido."),
  birthDate: z.string().trim().refine((value) => !value || isValidBirthDate(value), "Informe uma data de nascimento válida."),
  gender: z.union([z.enum(genderValues), z.literal("")]),
});

export const addressSchema = z.object({
  addressId: z.union([z.string().uuid("Endereço inválido."), z.literal("")]),
  label: z.string().trim().min(2, "Informe um apelido para o endereço.").max(30, "Use no máximo 30 caracteres."),
  postalCode: z.string().trim().refine((value) => onlyDigits(value).length === 8, "Informe um CEP válido."),
  street: z.string().trim().min(2, "Informe a rua.").max(120, "Use no máximo 120 caracteres."),
  number: z.string().trim().min(1, "Informe o número.").max(20, "Use no máximo 20 caracteres."),
  complement: z.string().trim().max(80, "Use no máximo 80 caracteres."),
  district: z.string().trim().min(2, "Informe o bairro.").max(80, "Use no máximo 80 caracteres."),
  city: z.string().trim().min(2, "Informe a cidade.").max(80, "Use no máximo 80 caracteres."),
  state: z.string().trim().toUpperCase().refine((value) => brazilianStates.has(value), "Selecione um estado válido."),
  isPrimary: z.boolean(),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Informe sua senha atual."),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH, "A nova senha deve ter pelo menos 8 caracteres.").regex(PASSWORD_LETTER_PATTERN, "Inclua pelo menos uma letra.").regex(PASSWORD_NUMBER_PATTERN, "Inclua pelo menos um número."),
  confirmPassword: z.string().min(1, "Confirme a nova senha."),
}).superRefine((data, context) => {
  if (data.newPassword !== data.confirmPassword) {
    context.addIssue({ code: "custom", path: ["confirmPassword"], message: "As senhas não coincidem." });
  }
});
