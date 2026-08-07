import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail.")
  .max(254, "O e-mail é muito longo.")
  .email("Informe um e-mail válido.")
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .regex(/[A-Za-zÀ-ÿ]/, "Inclua pelo menos uma letra.")
  .regex(/[0-9]/, "Inclua pelo menos um número.");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo.")
    .max(80, "O nome deve ter no máximo 80 caracteres."),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha."),
});
