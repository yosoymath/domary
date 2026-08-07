import { z } from "zod";

const optionalUrl = z.union([
  z.literal(""),
  z.string().trim().url("Informe uma URL válida."),
]);

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres.").max(80),
  description: z.string().trim().max(500).optional().default(""),
  imageUrl: optionalUrl.optional().default(""),
  isActive: z.boolean(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Informe um título com pelo menos 2 caracteres.").max(120),
  description: z.string().trim().min(10, "A descrição deve ter pelo menos 10 caracteres.").max(5000),
  categoryId: z.string().uuid("Selecione uma categoria válida."),
  price: z.coerce.number().positive("O preço deve ser maior que zero.").max(999999.99),
  compareAtPrice: z.union([z.literal(""), z.coerce.number().positive().max(999999.99)]).optional().default(""),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isFeatured: z.boolean(),
  variants: z.string().trim().min(1, "Informe ao menos uma variação e seu estoque.").max(100000, "A grade possui variações demais."),
  images: z.string().trim().optional().default(""),
});

export const promotionSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres.").max(120),
  code: z.string().trim().max(40).optional().default(""),
  description: z.string().trim().max(500).optional().default(""),
  percentage: z.coerce.number().min(0.01, "O desconto deve ser maior que zero.").max(100, "O desconto não pode ultrapassar 100%."),
  isActive: z.boolean(),
  startsAt: z.string().trim().optional().default(""),
  endsAt: z.string().trim().optional().default(""),
});

export type AdminFieldErrors = Record<string, string[] | undefined>;

export type AdminActionState = {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: AdminFieldErrors;
};
