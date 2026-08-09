import { z } from "zod";
import { PASSWORD_LETTER_PATTERN, PASSWORD_MIN_LENGTH, PASSWORD_NUMBER_PATTERN } from "@/lib/password-policy";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail.")
  .max(254, "O e-mail é muito longo.")
  .email("Informe um e-mail válido.")
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .regex(PASSWORD_LETTER_PATTERN, "Inclua pelo menos uma letra.")
  .regex(PASSWORD_NUMBER_PATTERN, "Inclua pelo menos um número.");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo.")
    .max(80, "O nome deve ter no máximo 80 caracteres."),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Confirme sua senha."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha."),
});
